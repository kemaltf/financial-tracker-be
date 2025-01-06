import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { Wallet } from 'src/wallet/wallet.entity';
import { AccountingEntry } from 'src/accountingEntry/accounting_entry.entity';
import { TransactionDTO } from './dto/transaction.dto';
import { TransactionType } from './transactionType/transaction-type.entity';
import { Account } from '@app/account/account.entity';
import { TransactionAddress } from './transactionAddress/transaction-address.entity';
import { TransactionDetail } from './transactionDetail/transaction-detail.entity';
import { Product } from '@app/product/entity/product.entity';
import { WalletLog } from '../wallet/walletLogs/wallet-log.entity';
import { Store } from '@app/store/store.entity';
import { Customer } from '@app/customer/entity/customer.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(TransactionType)
    private transactionTypeRepository: Repository<TransactionType>,
    @InjectRepository(AccountingEntry)
    private accountingEntryRepository: Repository<AccountingEntry>,
    @InjectRepository(TransactionAddress)
    private transactionAddressRepository: Repository<TransactionAddress>,
    @InjectRepository(TransactionDetail)
    private transactionDetailRepository: Repository<TransactionDetail>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(WalletLog)
    private readonly walletLog: Repository<WalletLog>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  /**
   *
   * === Core logic for creating transactions ===
   * User akan menentukan wallet, tipe transaksi, detail transaksi, toko transaksi
   * Difungsi ini akan mengupdate saldo wallet, transaction, accountant table
   * Proses logikanya di bagian ini
   *
   */
  async createTransaction(
    userId: string,
    transactionDTO: TransactionDTO,
  ): Promise<Transaction> {
    const {
      originWalletId,
      transactionTypeId,
      amount,
      description,
      address,
      details,
      storeId,
      destinationWalletId,
      customerId,
    } = transactionDTO;

    console.log('transsaction', transactionDTO);

    // 1. Validate transaction type
    const transactionType =
      await this.validateTransactionType(transactionTypeId);

    // 2. Validate wallet
    const [originWallet, destinationWallet] = await this.validateWallet(
      originWalletId,
      destinationWalletId,
      userId,
      transactionType.name,
      amount,
    );

    // 3. Validate Store
    const store = await this.validateStore(storeId);
    const customer = await this.validateCustomemr(customerId);

    // 3. Create a transaction
    const transaction = this.transactionRepository.create({
      user: { id: userId },
      originWallet: { id: originWalletId },
      destinationWallet: { id: destinationWalletId },
      transactionType,
      amount,
      description,
      date: new Date(),
      store: { id: store.id },
      customer: {
        id: customer.id,
      },
    });
    await this.transactionRepository.save(transaction);

    console.log('kebawah', transaction);
    // 4. Save address if exist
    if (address) await this.createTransactionAddress(transaction, address);

    // 5. Save detail transaction if exist
    if (details?.length)
      await this.createTransactionDetails(transaction, details);

    // Handle the transaction logic based on its type
    await this.processAccountingNWallet(
      transaction,
      transactionType.name,
      originWallet,
      destinationWallet,
      amount,
      userId,
    );

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

  private async validateCustomemr(customerId: number) {
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

  /**
   * Helper to validate wallet ownership and balance
   */
  private async validateWallet(
    originWalletId: number,
    destinationWalletId: number,
    userId: string,
    transactionType: string,
    amount?: number,
  ): Promise<Wallet[]> {
    const originWallet = await this.walletRepository.findOne({
      where: { id: originWalletId, users: { id: userId } },
    });
    const destinationWallet = await this.walletRepository.findOne({
      where: { id: destinationWalletId, users: { id: userId } },
    });

    if (!originWallet || !destinationWallet)
      throw new NotFoundException('Wallet not found');

    // Validate wallet balance if it's a debit transaction
    if (
      this.isDebitTransaction(transactionType) &&
      this.checkWalletBalance(originWallet, amount)
    ) {
      throw new Error('Insufficient balance for this transaction');
    }
    return [originWallet, destinationWallet];
  }

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
  private async getAccountByCode(code: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { code } });
    if (!account) {
      throw new Error(`Account with code ${code} not found`);
    }
    return account;
  }

  /**
   * Helper to check wallet balance
   */
  private async checkWalletBalance(
    wallet: Wallet,
    amount: number,
  ): Promise<void> {
    console.log('wallet?', wallet);
    console.log('typeof', typeof wallet.balance);
    if (wallet.balance < amount) {
      throw new BadRequestException(
        'Insufficient balance for this transaction',
      );
    }
  }

  /**
   * helper to check whether is debit transaction
   */
  private isDebitTransaction(transactionTypeName: string): boolean {
    const debitTransactionTypes = [
      'Pengeluaran',
      'Pengeluaran Piutang',
      'Tarik Modal',
      'Transfer',
    ];
    return debitTransactionTypes.includes(transactionTypeName);
  }

  /**
   * Create accounting entry
   */
  private createAccountingEntry(
    transaction: Transaction,
    account: Account,
    entryType: 'DEBIT' | 'CREDIT',
    amount: number,
    description: string,
  ): AccountingEntry {
    return this.accountingEntryRepository.create({
      transaction,
      account,
      entry_type: entryType,
      amount,
      description,
    });
  }

  /**
   * Create transaction address
   */
  private async createTransactionAddress(
    transaction: Transaction,
    address: any,
  ): Promise<void> {
    const {
      recipientName,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      phoneNumber,
    } = address;

    const transactionAddress = this.transactionAddressRepository.create({
      transaction,
      recipientName,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode,
      phoneNumber,
    });

    await this.transactionAddressRepository.save(transactionAddress);
  }

  /**
   * Create transaction details
   */
  private async createTransactionDetails(
    transaction: Transaction,
    details: {
      productId: number;
      quantity: number;
    }[],
  ): Promise<void> {
    for (const detail of details) {
      const product = await this.productRepository.findOne({
        where: { id: detail.productId },
      });
      if (!product)
        throw new NotFoundException(
          `Product with ID ${detail.productId} not found`,
        );

      const totalPrice = product.price * detail.quantity;
      const transactionDetail = this.transactionDetailRepository.create({
        transaction,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        quantity: detail.quantity,
        totalPrice,
      });
      await this.transactionDetailRepository.save(transactionDetail);
    }
  }

  async processAccountingNWallet(
    transaction: Transaction,
    transactionTypeName: string,
    originWallet: Wallet,
    destinationWallet: Wallet,
    amount: number,
    userId: string,
  ): Promise<void> {
    // Get account id
    const cashAccount = await this.getAccountByCode('101');
    const incomeAccount = await this.getAccountByCode('401');
    const expenseAccount = await this.getAccountByCode('501');
    const debtAccount = await this.getAccountByCode('201');
    const receivableAccount = await this.getAccountByCode('301');
    const equityAccount = await this.getAccountByCode('601');

    const entries: AccountingEntry[] = [];
    const oldWalletState = { balance: originWallet.balance };
    console.log('tess', typeof originWallet.balance);
    console.log('tess 2', typeof amount);

    // Logic accounting
    switch (transactionTypeName) {
      case 'Pemasukan':
        originWallet.balance += amount;
        entries.push(
          this.createAccountingEntry(
            transaction,
            cashAccount,
            'DEBIT',
            amount,
            `Kas bertambah dari pemasukan untuk transaksi #${transaction.id}`,
          ),
          this.createAccountingEntry(
            transaction,
            incomeAccount,
            'CREDIT',
            amount,
            `Pendapatan bertambah untuk transaksi #${transaction.id}`,
          ),
        );
        break;

      case 'Pengeluaran':
        await this.checkWalletBalance(originWallet, amount);
        originWallet.balance -= amount;
        entries.push(
          this.createAccountingEntry(
            transaction,
            expenseAccount,
            'DEBIT',
            amount,
            `Beban bertambah untuk transaksi #${transaction.id}`,
          ),
          this.createAccountingEntry(
            transaction,
            cashAccount,
            'CREDIT',
            amount,
            `Kas berkurang untuk transaksi #${transaction.id}`,
          ),
        );
        break;

      case 'Hutang':
        originWallet.balance += amount;
        entries.push(
          this.createAccountingEntry(
            transaction,
            debtAccount,
            'CREDIT',
            amount,
            `Hutang bertambah untuk transaksi #${transaction.id}`,
          ),
          this.createAccountingEntry(
            transaction,
            cashAccount,
            'DEBIT',
            amount,
            `Kas bertambah dari pencatatan hutang untuk transaksi #${transaction.id}`,
          ),
        );
        break;

      case 'Piutang':
        await this.checkWalletBalance(originWallet, amount);
        originWallet.balance -= amount;
        entries.push(
          this.createAccountingEntry(
            transaction,
            receivableAccount,
            'DEBIT',
            amount,
            `Piutang bertambah untuk transaksi #${transaction.id}`,
          ),
          this.createAccountingEntry(
            transaction,
            incomeAccount,
            'CREDIT',
            amount,
            `Pendapatan bertambah untuk transaksi #${transaction.id}`,
          ),
        );
        break;

      case 'Tanam Modal':
        originWallet.balance += amount;
        entries.push(
          this.createAccountingEntry(
            transaction,
            cashAccount,
            'DEBIT',
            amount,
            `Kas bertambah dari penambahan modal untuk transaksi #${transaction.id}`,
          ),
          this.createAccountingEntry(
            transaction,
            equityAccount,
            'CREDIT',
            amount,
            `Ekuitas modal bertambah untuk transaksi #${transaction.id}`,
          ),
        );
        break;

      case 'Tarik Modal':
        await this.checkWalletBalance(originWallet, amount);
        originWallet.balance -= amount;
        entries.push(
          this.createAccountingEntry(
            transaction,
            equityAccount,
            'DEBIT',
            amount,
            `Ekuitas modal berkurang untuk transaksi #${transaction.id}`,
          ),
          this.createAccountingEntry(
            transaction,
            cashAccount,
            'CREDIT',
            amount,
            `Kas berkurang untuk transaksi #${transaction.id}`,
          ),
        );
        break;

      case 'Transfer':
        await this.handleTransfer(
          transaction,
          originWallet,
          destinationWallet,
          amount,
        );
        break;

      default:
        throw new Error(`Unsupported transaction type: ${transactionTypeName}`);
    }

    await this.walletRepository.save(originWallet);
    const newWalletState = { balance: originWallet.balance };
    await this.walletLog.save(
      this.walletLog.create({
        action: 'Update',
        oldValue: oldWalletState,
        newValue: newWalletState,
        wallet: originWallet,
        performed_by: userId,
      }),
    );

    await this.accountingEntryRepository.save(entries);
  }

  private async handleTransfer(
    transaction: Transaction,
    originWallet: Wallet,
    destinationWallet: Wallet,
    amount: number,
  ): Promise<void> {
    if (!destinationWallet) {
      throw new NotFoundException('Destination wallet not found');
    }

    // Check if the source wallet has enough balance for the transfer
    if (originWallet.balance < amount) {
      throw new BadRequestException('Insufficient balance for the transfer');
    }

    // Deduct the amount from the source wallet
    originWallet.balance -= amount;
    await this.walletRepository.save(originWallet);

    // Add the amount to the destination wallet
    destinationWallet.balance += amount;
    await this.walletRepository.save(destinationWallet);

    // Create accounting entries for the transfer
    const sourceAccount = await this.getAccountByCode('101'); // Example account code for source wallet
    const destinationAccount = await this.getAccountByCode('102'); // Example account code for destination wallet

    const entries: AccountingEntry[] = [
      this.createAccountingEntry(
        transaction,
        sourceAccount,
        'CREDIT',
        amount,
        `Transferred to wallet ${destinationWallet.id} for transaction #${transaction.id}`,
      ),
      this.createAccountingEntry(
        transaction,
        destinationAccount,
        'DEBIT',
        amount,
        `Transferred from wallet ${originWallet.id} for transaction #${transaction.id}`,
      ),
    ];

    // Save accounting entries
    await this.accountingEntryRepository.save(entries);

    // Optionally, log the transfer action in a transaction log
    const oldWalletState = { balance: originWallet.balance };
    const newWalletState = { balance: destinationWallet.balance };
    await this.walletLog.save(
      this.walletLog.create({
        action: 'Transfer',
        oldValue: oldWalletState,
        newValue: newWalletState,
        wallet: originWallet,
      }),
    );
  }
}
