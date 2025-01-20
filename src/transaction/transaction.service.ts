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
import { TransactionProduct } from './transactionProduct/transaction-product.entity';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import {
  FinancialParty,
  Role,
} from '@app/financial-party/entity/financial-party.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import { HandleErrors } from '@app/common/decorators';
import { AccountType, BalanceImpactSide } from '@app/account/account.entity';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionType)
    private transactionTypeRepository: Repository<TransactionType>,

    @InjectRepository(SubAccount)
    private readonly subAccountRepository: Repository<SubAccount>,

    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(FinancialParty)
    private readonly financialPartyRepository: Repository<FinancialParty>,
    @InjectRepository(DebtsAndReceivables)
    private readonly debtsAndReceivablesRepository: Repository<DebtsAndReceivables>,
    @InjectRepository(TransactionContact)
    private transactionContactRepository: Repository<TransactionContact>,
    @InjectRepository(TransactionProduct)
    private transactionProductRepository: Repository<TransactionProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
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
      transactionTypeId, // need to be validated
      amount,
      storeId, // need to be validated
      customerId, // need to be validated
      creditAccountId, // need to be validated
      debitAccountId, // need to be validated
      note,
      address,
      orders,
      creditorId,
      debtorId,
      dueDate,
    } = transactionDTO;

    // 1. Validate transaction type
    const transactionType =
      await this.validateTransactionType(transactionTypeId);

    // 2. Validate Store
    const store = storeId ? await this.validateStore(storeId) : null;
    // 3. Validate customer
    const customer = customerId
      ? await this.validateFinancialParty(customerId, Role.customer)
      : null;

    // 4. Validate creditor
    const creditor = creditorId
      ? await this.validateFinancialParty(creditorId, Role.creditor)
      : null;

    // 5. Validate debtor
    const debtor = debtorId
      ? await this.validateFinancialParty(debtorId, Role.debtor)
      : null;

    // 6. Validate debt and receivable
    this.validateDebtAndReceivable(
      transactionType.name,
      creditor?.id,
      debtor?.id,
      dueDate,
    );

    // 6. Validate account
    const creditAccount = await this.validateaccount(creditAccountId);
    const debitAccount = await this.validateaccount(debitAccountId);

    if (!creditAccount || !debitAccount) {
      throw new NotFoundException(
        `Credit/Debit account with ID ${creditAccountId} does not exist.`,
      );
    }

    // 8. Validasi saldo akun debit dan kredit agar tidak negatif
    await this.validateAccountBalance(debitAccount, amount, 'debit'); // Validasi untuk akun debit
    await this.validateAccountBalance(creditAccount, amount, 'credit'); // Validasi untuk akun kredit

    // 5. Create a transaction
    const transaction = this.transactionRepository.create({
      transactionType: { id: transactionType.id },
      amount,
      note,
      store: { id: store?.id },
      customer: {
        id: customer?.id,
      },
      user: { id: userId },
      debitAccount: { id: debitAccount.id },
      creditAccount: { id: creditAccount.id },
    });

    await this.updateSubAccountBalance(
      transaction.amount,
      debitAccount,
      creditAccount,
    );
    await this.transactionRepository.save(transaction);

    // 7. Save address if exist
    if (address) await this.createTransactionAddress(transaction, address);

    // 8. Save orders transaction if exist
    if (orders?.length) await this.createTransactionOrders(transaction, orders);

    // 9. Save debt and receivable if exist
    if (
      transactionType.name === 'Hutang' ||
      transactionType.name === 'Piutang'
    ) {
      const debtsAndReceivables = this.debtsAndReceivablesRepository.create({
        transaction,
        dueDate,
        status: 'pending',
        creditor: { id: creditor.id },
        debtor: { id: debtor.id },
      });
      await this.debtsAndReceivablesRepository.save(debtsAndReceivables);
    }

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

  private async validateFinancialParty(financialPartyId: number, role: Role) {
    // Periksa keberadaan store
    const financialParty = await this.financialPartyRepository.findOne({
      where: { id: financialPartyId, role },
    });
    if (!financialParty) {
      throw new NotFoundException(
        `Financial Party with ID ${financialPartyId} does not exist.`,
      );
    }
    return financialParty;
  }

  private async validateaccount(accountId: number) {
    // Periksa keberadaan store
    const account = await this.subAccountRepository.findOne({
      where: { id: accountId },
      relations: ['account'],
    });
    if (!account) {
      throw new NotFoundException(
        `Account with ID ${accountId} does not exist.`,
      );
    }
    return account;
  }

  private validateDebtAndReceivable(
    transactionTypeName: string,
    creditorId: number,
    debtorId: number,
    dueDate: Date,
  ) {
    if (transactionTypeName === 'Hutang' || transactionTypeName === 'Piutang') {
      if ([creditorId, debtorId, dueDate].some((value) => !value)) {
        throw new NotFoundException(
          `Creditor ID, Debtor ID, and Due Date must be provided for ${transactionTypeName} transaction.`,
        );
      }
    }
  }

  async validateAccountBalance(
    account: SubAccount,
    amount: number,
    position: 'debit' | 'credit',
  ): Promise<void> {
    if (position === 'debit') {
      // // Jika akun di posisi debit, Asset dan Expense akan bertambah
      // if (
      //   account.account.type === AccountType.ASSET ||
      //   account.account.type === AccountType.EXPENSE
      // ) {
      //   if (account.balance < amount) {
      //     throw new Error(
      //       `Saldo akun ${account.name} tidak cukup untuk melakukan transaksi debit.`,
      //     );
      //   }
      // }
      // Jika akun di posisi debit, Liability dan Equity akan berkurang
      if (
        account.account.type === AccountType.LIABILITY ||
        account.account.type === AccountType.EQUITY
      ) {
        if (account.balance - amount < 0) {
          throw new Error(
            `Saldo akun ${account.name} tidak cukup untuk transaksi debit pada jenis Liability/Equity.`,
          );
        }
      }
    } else if (position === 'credit') {
      // // Jika akun di posisi kredit, Liability dan Equity akan bertambah
      // if (
      //   account.account.type === AccountType.LIABILITY ||
      //   account.account.type === AccountType.EQUITY
      // ) {
      //   if (account.balance + amount < 0) {
      //     throw new Error(
      //       `Saldo akun ${account.name} tidak cukup untuk transaksi kredit.`,
      //     );
      //   }
      // }
      // Jika akun di posisi kredit, Asset dan Expense akan berkurang
      if (
        account.account.type === AccountType.ASSET ||
        account.account.type === AccountType.EXPENSE
      ) {
        if (account.balance - amount < 0) {
          throw new Error(
            `Saldo akun ${account.name} tidak cukup untuk transaksi kredit pada jenis Asset/Expense.`,
          );
        }
      }
    }
  }

  async updateSubAccountBalance(
    amount: number,
    debitAccount: SubAccount,
    creditAccount: SubAccount,
  ) {
    // Update the balance for the debit account
    const debitAccountBalanceImpact =
      debitAccount.account.normalBalance === BalanceImpactSide.DEBIT
        ? amount
        : -amount;
    await this.updateAccountBalance(debitAccount, debitAccountBalanceImpact);

    // Update the balance for the credit account
    const creditAccountBalanceImpact =
      creditAccount.account.normalBalance === BalanceImpactSide.DEBIT
        ? -amount
        : amount;

    await this.updateAccountBalance(creditAccount, creditAccountBalanceImpact);
  }

  async updateAccountBalance(subAccount: SubAccount, balanceImpact: number) {
    // Fetch the current balance of the subAccount
    subAccount.balance += balanceImpact; // Adjust the balance

    // Save the updated balance back to the database
    await this.subAccountRepository.save(subAccount);
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
   * Create transaction address
   */
  private async createTransactionAddress(
    transaction: Transaction,
    address: {
      recipientName: string;
      addressLine1: string;
      addressLine2?: string | null;
      city: string;
      state: string;
      postalCode: string;
      phoneNumber: string;
    },
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

    const transactionAddress = this.transactionContactRepository.create({
      transaction,
      addressLine1,
      addressLine2: addressLine2 || null,
      city,
      state,
      postalCode,
      phoneNumber,
      name: recipientName,
    });

    await this.transactionContactRepository.save(transactionAddress);
  }

  /**
   * Create transaction details
   */
  private async createTransactionOrders(
    transaction: Transaction,
    orders: {
      productId: number;
      quantity: number;
    }[],
  ): Promise<void> {
    for (const detail of orders) {
      const product = await this.productRepository.findOne({
        where: { id: detail.productId },
      });
      if (!product)
        throw new NotFoundException(
          `Product with ID ${detail.productId} not found`,
        );

      const totalPrice = product.price * detail.quantity;
      const transactionDetail = this.transactionProductRepository.create({
        transaction,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        quantity: detail.quantity,
        totalPrice,
      });
      await this.transactionProductRepository.save(transactionDetail);
    }
  }

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
