import {
  // BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { TransactionDTO } from './dto/transaction.dto';
import { TransactionType } from './transactionType/transaction-type.entity';
import { SubAccount } from '@app/account/sub-account.entity';
import { TransactionContact } from './transaction-contact/transaction-contact.entity';
import { TransactionProduct } from './transactionDetail/transaction-detail.entity';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import { Customer } from '@app/customer/entity/customer.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import { HandleErrors } from '@app/common/decorators';
import { DebtorCreditor } from '@app/creditor-debtor/creditor-debtor.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionType)
    private transactionTypeRepository: Repository<TransactionType>,
    @InjectRepository(TransactionContact)
    private transactionAddressRepository: Repository<TransactionContact>,
    @InjectRepository(TransactionProduct)
    private transactionDetailRepository: Repository<TransactionProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(SubAccount)
    private readonly accountRepository: Repository<SubAccount>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(DebtsAndReceivables)
    private readonly debtsAndReceivablesRepository: Repository<DebtsAndReceivables>,
    @InjectRepository(DebtorCreditor)
    private readonly debtorCreditorRepository: Repository<DebtorCreditor>,
  ) {}

  /**
   *
   * === Core logic for creating transactions ===
   * User akan menentukan wallet, tipe transaksi, detail transaksi, toko transaksi
   * Difungsi ini akan mengupdate saldo wallet, transaction, accountant table
   * Proses logikanya di bagian ini
   *
   */
  @HandleErrors()
  async createTransaction(
    userId: string,
    transactionDTO: TransactionDTO,
  ): Promise<Transaction> {
    const {
      transactionTypeId,
      amount,
      address,
      storeId,
      customerId,
      creditAccountId,
      debitAccountId,
      note,
    } = transactionDTO;
    console.log('transaction', transactionDTO);

    // 1. Validate transaction type
    const transactionType =
      await this.validateTransactionType(transactionTypeId);

    // 3. Validate Store
    // Validate store if storeId exists
    const store = storeId ? await this.validateStore(storeId) : null;

    // Validate customer if customerId exists
    const customer = customerId
      ? await this.validateCustomer(customerId)
      : null;

    // Validate customer if customerId exists
    // const financialParty = financialPartyId
    //   ? await this.validateFinancialParty(
    //       financialPartyId,
    //       transactionType.name,
    //     )
    //   : null;

    // 3. Create a transaction
    const transaction = this.transactionRepository.create({
      transactionType: { id: transactionType.id },
      amount,
      note,
      store: { id: store?.id },
      customer: {
        id: customer?.id,
      },
      user: { id: userId },
      debitAccount: { id: debitAccountId },
      creditAccount: { id: creditAccountId },
      transactionContact: { ...address },
      // debtsAndReceivables: {},
    });
    await this.transactionRepository.save(transaction);

    console.log('kebawah', transaction);
    // 4. Save address if exist
    // if (address) await this.createTransactionAddress(transaction, address);

    // 5. Save detail transaction if exist
    // if (details?.length)
    //   await this.createTransactionDetails(transaction, details);

    // Handle the transaction logic based on its type
    // await this.processAccountingNWallet(
    //   transaction,
    //   transactionType.name,
    //   originWallet,
    //   destinationWallet,
    //   amount,
    //   userId,
    //   dueDate,
    //   financialParty?.id,
    // );

    return transaction;
  }

  private async validateStore(storeId: number) {
    // Periksa keberadaan store
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException(`Store with ID ${storeId} does not exist.`);
    }
    return store;
  }

  private async validateCustomer(customerId: number) {
    // Periksa keberadaan store
    const store = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!store) {
      throw new NotFoundException(
        `Customer with ID ${customerId} does not exist.`,
      );
    }
    return store;
  }

  // private async validateFinancialParty(
  //   financialPartyId: number,
  //   transactionTypeName: string,
  // ) {
  //   // Periksa keberadaan store
  //   if (transactionTypeName !== 'Hutang' && transactionTypeName !== 'Piutang') {
  //     console.error('KESINI GA WOIU?');
  //     throw new BadRequestException(
  //       'Invalid transaction type. Must be either "Hutang" or "Piutang".',
  //     );
  //   }

  //   let debtorCreditor;
  //   if (transactionTypeName === 'Hutang') {
  //     debtorCreditor = await this.debtorCreditorRepository.findOne({
  //       where: { id: financialPartyId, role: 'debtor' },
  //     });
  //   }

  //   if (transactionTypeName === 'Piutang') {
  //     debtorCreditor = await this.debtorCreditorRepository.findOne({
  //       where: { id: financialPartyId, role: 'creditor' },
  //     });
  //   }

  //   if (!debtorCreditor) {
  //     throw new NotFoundException(
  //       `Debtor or Creditor with ID ${financialPartyId} does not exist.`,
  //     );
  //   }
  //   return debtorCreditor;
  // }

  /**
   * Helper to validate transaction type
   */
  private async validateTransactionType(transactionTypeId: number) {
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: transactionTypeId },
    });
    if (!transactionType) {
      throw new NotFoundException('Transaction type not found');
    }
    return transactionType;
  }

  /**
   * Helper to get account by code
   */
  private async getAccountByCode(code: string): Promise<SubAccount> {
    const account = await this.accountRepository.findOne({ where: { code } });
    if (!account) {
      throw new Error(`Account with code ${code} not found`);
    }
    return account;
  }

  /**
   * helper to check whether is debit transaction
   */
  // private isDebitTransaction(transactionTypeName: string): boolean {
  //   const debitTransactionTypes = [
  //     'Pengeluaran',
  //     'Pengeluaran Piutang',
  //     'Tarik Modal',
  //     'Transfer',
  //     'Piutang',
  //   ];
  //   return debitTransactionTypes.includes(transactionTypeName);
  // }

  /**
   * Create transaction address
   */
  // private async createTransactionAddress(
  //   transaction: Transaction,
  //   address: any,
  // ): Promise<void> {
  //   const {
  //     recipientName,
  //     addressLine1,
  //     addressLine2,
  //     city,
  //     state,
  //     postalCode,
  //     phoneNumber,
  //   } = address;

  //   const transactionAddress = this.transactionAddressRepository.create({
  //     transaction,
  //     recipientName,
  //     addressLine1,
  //     addressLine2: addressLine2 || null,
  //     city,
  //     state,
  //     postalCode,
  //     phoneNumber,
  //   });

  //   await this.transactionAddressRepository.save(transactionAddress);
  // }

  /**
   * Create transaction details
   */
  // private async createTransactionDetails(
  //   transaction: Transaction,
  //   details: {
  //     productId: number;
  //     quantity: number;
  //   }[],
  // ): Promise<void> {
  //   for (const detail of details) {
  //     const product = await this.productRepository.findOne({
  //       where: { id: detail.productId },
  //     });
  //     if (!product)
  //       throw new NotFoundException(
  //         `Product with ID ${detail.productId} not found`,
  //       );

  //     const totalPrice = product.price * detail.quantity;
  //     const transactionDetail = this.transactionDetailRepository.create({
  //       transaction,
  //       productName: product.name,
  //       productSku: product.sku,
  //       unitPrice: product.price,
  //       quantity: detail.quantity,
  //       totalPrice,
  //     });
  //     await this.transactionDetailRepository.save(transactionDetail);
  //   }
  // }

  // private async processAccountingNWallet(
  //   transaction: Transaction,
  //   transactionTypeName: string,
  //   originWallet: Wallet,
  //   destinationWallet: Wallet,
  //   amount: number,
  //   userId: string,
  //   dueDate?: Date,
  //   financialPartyId?: number,
  // ): Promise<void> {
  //   // Get account id
  //   const cashAccount = await this.getAccountByCode('101');
  //   const incomeAccount = await this.getAccountByCode('401');
  //   const expenseAccount = await this.getAccountByCode('501');
  //   const debtAccount = await this.getAccountByCode('201');
  //   const receivableAccount = await this.getAccountByCode('301');
  //   const equityAccount = await this.getAccountByCode('601');

  //   // const entries: AccountingEntry[] = [];
  //   const oldWalletState = { balance: originWallet.balance };
  //   console.log('tess', typeof originWallet.balance);
  //   console.log('tess 2', typeof amount);

  //   // Logic accounting
  //   switch (transactionTypeName) {
  //     case 'Pemasukan':
  //       originWallet.balance += amount;
  //       // entries.push(
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     cashAccount,
  //       //     'DEBIT',
  //       //     amount,
  //       //     `Kas bertambah dari pemasukan untuk transaksi #${transaction.id}`,
  //       //   ),
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     incomeAccount,
  //       //     'CREDIT',
  //       //     amount,
  //       //     `Pendapatan bertambah untuk transaksi #${transaction.id}`,
  //       //   ),
  //       // );
  //       break;

  //     case 'Pengeluaran':
  //       // await this.checkWalletBalance(originWallet, amount);
  //       originWallet.balance -= amount;
  //       // entries.push(
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     expenseAccount,
  //       //     'DEBIT',
  //       //     amount,
  //       //     `Beban bertambah untuk transaksi #${transaction.id}`,
  //       //   ),
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     cashAccount,
  //       //     'CREDIT',
  //       //     amount,
  //       //     `Kas berkurang untuk transaksi #${transaction.id}`,
  //       //   ),
  //       // );
  //       break;

  //     case 'Hutang':
  //       originWallet.balance += amount;

  //       if (!financialPartyId) {
  //         throw new NotFoundException(
  //           `Debtor with ID ${financialPartyId} not found`,
  //         );
  //       }

  //       // Update DebtsAndReceivables table for debt creation
  //       await this.createDebtEntry(
  //         transaction,
  //         amount,
  //         dueDate,
  //         financialPartyId,
  //       );
  //       // entries.push(
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     debtAccount,
  //       //     'CREDIT',
  //       //     amount,
  //       //     `Hutang bertambah untuk transaksi #${transaction.id}`,
  //       //   ),
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     cashAccount,
  //       //     'DEBIT',
  //       //     amount,
  //       //     `Kas bertambah dari pencatatan hutang untuk transaksi #${transaction.id}`,
  //       //   ),
  //       // );
  //       break;

  //     case 'Piutang':
  //       // await this.checkWalletBalance(originWallet, amount);
  //       originWallet.balance -= amount;

  //       if (!financialPartyId) {
  //         throw new NotFoundException(
  //           `Creditor with ID ${financialPartyId} not found`,
  //         );
  //       }

  //       // Update DebtsAndReceivables table for receivable creation
  //       await this.createReceivableEntry(
  //         transaction,
  //         amount,
  //         dueDate,
  //         financialPartyId,
  //       );

  //       // entries.push(
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     receivableAccount,
  //       //     'DEBIT',
  //       //     amount,
  //       //     `Piutang bertambah untuk transaksi #${transaction.id}`,
  //       //   ),
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     incomeAccount,
  //       //     'CREDIT',
  //       //     amount,
  //       //     `Pendapatan bertambah untuk transaksi #${transaction.id}`,
  //       //   ),
  //       // );
  //       break;

  //     case 'Tanam Modal':
  //       originWallet.balance += amount;
  //       // entries.push(
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     cashAccount,
  //       //     'DEBIT',
  //       //     amount,
  //       //     `Kas bertambah dari penambahan modal untuk transaksi #${transaction.id}`,
  //       //   ),
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     equityAccount,
  //       //     'CREDIT',
  //       //     amount,
  //       //     `Ekuitas modal bertambah untuk transaksi #${transaction.id}`,
  //       //   ),
  //       // );
  //       break;

  //     case 'Tarik Modal':
  //       // await this.checkWalletBalance(originWallet, amount);
  //       originWallet.balance -= amount;
  //       // entries.push(
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     equityAccount,
  //       //     'DEBIT',
  //       //     amount,
  //       //     `Ekuitas modal berkurang untuk transaksi #${transaction.id}`,
  //       //   ),
  //       //   this.createAccountingEntry(
  //       //     transaction,
  //       //     cashAccount,
  //       //     'CREDIT',
  //       //     amount,
  //       //     `Kas berkurang untuk transaksi #${transaction.id}`,
  //       //   ),
  //       // );
  //       break;

  //     case 'Transfer':
  //       await this.handleTransfer(
  //         transaction,
  //         originWallet,
  //         destinationWallet,
  //         amount,
  //       );
  //       break;

  //     default:
  //       throw new Error(`Unsupported transaction type: ${transactionTypeName}`);
  //   }

  //   await this.walletRepository.save(originWallet);
  //   const newWalletState = { balance: originWallet.balance };
  //   await this.walletLog.save(
  //     this.walletLog.create({
  //       action: 'Update',
  //       oldValue: oldWalletState,
  //       newValue: newWalletState,
  //       wallet: originWallet,
  //       performed_by: userId,
  //     }),
  //   );
  // }

  // private async handleTransfer(
  //   transaction: Transaction,
  //   originWallet: Wallet,
  //   destinationWallet: Wallet,
  //   amount: number,
  // ): Promise<void> {
  //   if (!destinationWallet) {
  //     throw new NotFoundException('Destination wallet not found');
  //   }

  //   // Check if the source wallet has enough balance for the transfer
  //   // if (originWallet.balance < amount) {
  //   //   throw new BadRequestException('Insufficient balance for the transfer');
  //   // }

  //   // Deduct the amount from the source wallet
  //   originWallet.balance -= amount;
  //   await this.walletRepository.save(originWallet);

  //   // Add the amount to the destination wallet
  //   destinationWallet.balance += amount;
  //   await this.walletRepository.save(destinationWallet);

  //   // Create accounting entries for the transfer
  //   const sourceAccount = await this.getAccountByCode('101'); // Example account code for source wallet
  //   const destinationAccount = await this.getAccountByCode('102'); // Example account code for destination wallet

  //   // const entries: AccountingEntry[] = [
  //   //   this.createAccountingEntry(
  //   //     transaction,
  //   //     sourceAccount,
  //   //     'CREDIT',
  //   //     amount,
  //   //     `Transferred to wallet ${destinationWallet.id} for transaction #${transaction.id}`,
  //   //   ),
  //   //   this.createAccountingEntry(
  //   //     transaction,
  //   //     destinationAccount,
  //   //     'DEBIT',
  //   //     amount,
  //   //     `Transferred from wallet ${originWallet.id} for transaction #${transaction.id}`,
  //   //   ),
  //   // ];

  //   // Optionally, log the transfer action in a transaction log
  //   const oldWalletState = { balance: originWallet.balance };
  //   const newWalletState = { balance: destinationWallet.balance };
  //   await this.walletLog.save(
  //     this.walletLog.create({
  //       action: 'Transfer',
  //       oldValue: oldWalletState,
  //       newValue: newWalletState,
  //       wallet: originWallet,
  //     }),
  //   );
  // }

  // Helper function to create debt entry
  // private async createDebtEntry(
  //   transaction: Transaction,
  //   amount: number,
  //   dueDate: Date,
  //   debtorId: number,
  // ): Promise<void> {
  //   const debtEntry = this.debtsAndReceivablesRepository.create({
  //     amount,
  //     transaction,
  //     type: 'debt',
  //     dueDate,
  //     status: 'pending',
  //     financial_party: { id: debtorId },
  //   });
  //   await this.debtsAndReceivablesRepository.save(debtEntry);
  // }

  // Helper function to create receivable entry
  // private async createReceivableEntry(
  //   transaction: Transaction,
  //   amount: number,
  //   dueDate: Date,
  //   creditorId: number,
  // ): Promise<void> {
  //   const receivableEntry = this.debtsAndReceivablesRepository.create({
  //     amount,
  //     transaction,
  //     type: 'receivable',
  //     dueDate,
  //     status: 'pending',
  //     financial_party: { id: creditorId },
  //   });
  //   await this.debtsAndReceivablesRepository.save(receivableEntry);
  // }

  async getFinancialSummary() {
    const totalIncome = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Pemasukan' },
    });
    const totalExpense = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Pengeluaran' },
    });
    const totalDebt = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Hutang' },
    });
    const totalReceivables = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Piutang' },
    });
    const totalInvestment = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Tanam Modal' },
    });
    const totalWithdrawal = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Tarik Modal' },
    });
    const totalTransfer = await this.transactionRepository.sum('amount', {
      transactionType: { name: 'Transfer' },
    });
    const totalReceivablesIncome = await this.transactionRepository.sum(
      'amount',
      { transactionType: { name: 'Pemasukan Piutang' } },
    );
    const totalReceivablesExpense = await this.transactionRepository.sum(
      'amount',
      { transactionType: { name: 'Pengeluaran Piutang' } },
    );
    // const cashBalance = await this.walletRepository.sum('balance');

    return {
      totalIncome,
      totalExpense,
      totalDebt,
      totalReceivables,
      totalInvestment,
      totalWithdrawal,
      totalTransfer,
      totalReceivablesIncome,
      totalReceivablesExpense,
      profitLoss: totalIncome - totalExpense,
      // cashBalance,
    };
  }

  async getMonthlyTrends() {
    const trends = await this.transactionRepository.query(`
      SELECT
        DATE_FORMAT(t.date, '%Y-%m-01') AS month,
        SUM(CASE WHEN tt.name = 'Pemasukan' THEN t.amount ELSE 0 END) AS totalIncome,
        SUM(CASE WHEN tt.name = 'Pengeluaran' THEN t.amount ELSE 0 END) AS totalExpense
      FROM transactions t
      LEFT JOIN transaction_types tt
      ON t.transaction_type_id = tt.id 
      GROUP BY month
      ORDER BY month
    `);
    return trends;
  }

  async checkForAnomalies() {
    // Melakukan query ke database untuk mendeteksi pengeluaran yang tidak wajar
    const anomalies = await this.transactionRepository.query(`
      SELECT *
      FROM transactions t
      LEFT JOIN transaction_types tt
      ON t.transaction_type_id = tt.id 
      WHERE 
        -- Memeriksa hanya transaksi dengan jenis 'Pengeluaran'
        tt.name = 'Pengeluaran' 
        AND 
        -- Memeriksa pengeluaran yang lebih besar dari 1.5 kali rata-rata pengeluaran
        amount > (
          SELECT AVG(amount) * 1.5 
          FROM transactions 
          WHERE tt.name = 'Pengeluaran'
        )
    `);

    // Mengembalikan transaksi yang dianggap anomali
    return anomalies;
  }
}
