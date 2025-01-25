import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { AddressDTO, OrderDTO, TransactionDTO } from './dto/transaction.dto';
import { TransactionType } from './transactionType/transaction-type.entity';
import { SubAccount } from '@app/account/sub-account.entity';
import { TransactionContact } from './transaction-contact/transaction-contact.entity';
import { TransactionOrder } from './transactionProduct/transaction-product.entity';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import {
  FinancialParty,
  Role,
} from '@app/financial-party/entity/financial-party.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import { HandleErrors } from '@app/common/decorators';
import { AccountType, BalanceImpactSide } from '@app/account/account.entity';
import { User } from '@app/user/user.entity';

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
    @InjectRepository(TransactionOrder)
    private transactionOrderRepository: Repository<TransactionOrder>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   *
   * === Core logic for creating transactions ===
   *
   */
  @HandleErrors()
  async createTransaction(
    userId: string,
    transactionDTO: TransactionDTO,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      // VALIDATE TRANSACTION DATA
      const {
        transactionType,
        store,
        customer,
        creditor,
        debtor,
        creditAccount,
        debitAccount,
      } = await this.validateTransactionData(
        transactionTypeId,
        storeId,
        customerId,
        creditAccountId,
        debitAccountId,
        creditorId,
        debtorId,
        dueDate,
      );

      await this.validateAccountBalance(debitAccount, amount, 'debit');
      await this.validateAccountBalance(creditAccount, amount, 'credit');

      // CREATE TRANSACTION
      const transaction = await this.createTransactionEntity(
        userId,
        transactionType,
        amount,
        store,
        customer,
        creditAccount,
        debitAccount,
        note,
        address,
        orders,
        creditor,
        debtor,
        dueDate,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @HandleErrors()
  async updateTransaction(
    transactionId: number,
    userId: string,
    transactionDTO: TransactionDTO,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingTransaction = await this.findTransactionById(
        transactionId,
        userId,
      );
      console.log('existingTransaction', existingTransaction);
      if (!existingTransaction) {
        throw new NotFoundException(
          `Transaction with ID ${transactionId} not found.`,
        );
      }

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
      console.log('transactionDTO', transactionDTO);

      // VALIDATE TRANSACTION DATA
      const {
        transactionType,
        store,
        customer,
        creditor,
        debtor,
        creditAccount,
        debitAccount,
      } = await this.validateTransactionData(
        transactionTypeId,
        storeId,
        customerId,
        creditAccountId,
        debitAccountId,
        creditorId,
        debtorId,
        dueDate,
      );

      await this.validateAccountBalance(debitAccount, amount, 'debit');
      await this.validateAccountBalance(creditAccount, amount, 'credit');

      console.log('===>existingTransaction.amount', existingTransaction.amount);
      // reset the balance for the existing transaction
      const { creditUpdated, debitUpdated } =
        await this.updateSubAccountBalance(
          -existingTransaction.amount,
          existingTransaction.debitAccount,
          existingTransaction.creditAccount,
          queryRunner,
        );

      const updatedTransaction = await this.updateTransactionEntity(
        existingTransaction,
        transactionId,
        userId,
        transactionType,
        amount,
        store,
        customer,
        creditUpdated,
        debitUpdated,
        note,
        address,
        orders,
        creditor,
        debtor,
        dueDate,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return updatedTransaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  @HandleErrors()
  async deleteTransaction(transactionId: number, user: User): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingTransaction = await this.findTransactionById(
        transactionId,
        user.id,
      );
      console.log('first, existingTransaction', existingTransaction);

      if (!existingTransaction) {
        throw new NotFoundException(
          `Transaction with ID ${transactionId} not found.`,
        );
      }
      console.log('...', existingTransaction.user.username);
      console.log('....', user.username);
      if (existingTransaction.user.username !== user.username) {
        throw new ForbiddenException('You can only delete your own store');
      }

      // 2. Reset saldo untuk debit dan kredit sub-akun
      await this.updateSubAccountBalance(
        -existingTransaction.amount,
        existingTransaction.debitAccount,
        existingTransaction.creditAccount,
        queryRunner,
      );

      await this.transactionRepository.delete(transactionId);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async validateTransactionData(
    transactionTypeId: number,
    storeId: number,
    customerId: number,
    creditAccountId: number,
    debitAccountId: number,
    creditorId: number,
    debtorId: number,
    dueDate: Date,
  ) {
    // 1. Validate transaction type exist in the database
    const transactionType =
      await this.validateTransactionType(transactionTypeId);

    // 2. Validate Store exist in the database
    const store = storeId ? await this.validateStore(storeId) : null;
    const customer = customerId
      ? await this.validateFinancialParty(customerId, Role.customer)
      : null;
    const creditor = creditorId
      ? await this.validateFinancialParty(creditorId, Role.creditor)
      : null;
    const debtor = debtorId
      ? await this.validateFinancialParty(debtorId, Role.debtor)
      : null;

    this.validateDebtAndReceivable(
      transactionType.name,
      creditor?.id,
      debtor?.id,
      dueDate,
    );

    const creditAccount = await this.validateaccount(creditAccountId);
    const debitAccount = await this.validateaccount(debitAccountId);

    if (!creditAccount || !debitAccount) {
      throw new NotFoundException(
        `Credit/Debit account with ID ${creditAccountId} does not exist.`,
      );
    }

    return {
      transactionType,
      store,
      customer,
      creditor,
      debtor,
      creditAccount,
      debitAccount,
    };
  }

  private async createTransactionEntity(
    userId: string,
    transactionType: TransactionType,
    amount: number,
    store: Store,
    customer: FinancialParty,
    creditAccount: SubAccount,
    debitAccount: SubAccount,
    note: string,
    address: AddressDTO,
    orders: OrderDTO[],
    creditor: FinancialParty,
    debtor: FinancialParty,
    dueDate: Date,
    queryRunner: QueryRunner,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      transactionType: { id: transactionType.id },
      amount,
      note,
      store: { id: store?.id },
      customer: { id: customer?.id },
      user: { id: userId },
      debitAccount: { id: debitAccount.id },
      creditAccount: { id: creditAccount.id },
    });

    await this.updateSubAccountBalance(
      transaction.amount,
      debitAccount,
      creditAccount,
      queryRunner,
    );

    await queryRunner.manager.save(transaction);

    if (address)
      await this.createTransactionAddress(transaction, address, queryRunner);
    if (orders?.length)
      await this.createTransactionOrders(transaction, orders, queryRunner);

    if (
      transactionType.name === 'Hutang' ||
      transactionType.name === 'Piutang'
    ) {
      const debtsAndReceivables = this.debtsAndReceivablesRepository.create({
        dueDate,
        status: 'pending',
        creditor: { id: creditor.id },
        debtor: { id: debtor.id },
        transaction: [transaction],
      });
      await queryRunner.manager.save(debtsAndReceivables);
    }

    return transaction;
  }
  private async updateTransactionEntity(
    existingTransaction: Transaction,
    transactionId: number,
    userId: string,
    transactionType: TransactionType,
    amount: number,
    store: Store,
    customer: FinancialParty,
    creditAccount: SubAccount,
    debitAccount: SubAccount,
    note: string,
    address: AddressDTO,
    orders: OrderDTO[],
    creditor: FinancialParty,
    debtor: FinancialParty,
    dueDate: Date,
    queryRunner: QueryRunner,
  ): Promise<Transaction> {
    await queryRunner.manager.update(Transaction, transactionId, {
      transactionType: { id: transactionType.id },
      amount,
      note,
      store: { id: store?.id },
      customer: { id: customer?.id },
      user: { id: userId },
      debitAccount: { id: debitAccount.id },
      creditAccount: { id: creditAccount.id },
    });

    // 12. Update balances
    await this.updateSubAccountBalance(
      amount,
      debitAccount,
      creditAccount,
      queryRunner,
    );

    // 14. Update address if exist
    if (address) {
      await this.updateTransactionAddress(
        existingTransaction,
        address,
        queryRunner,
      );
    }

    // 15. Update orders if exist
    if (orders?.length) {
      await this.updateTransactionOrders(
        existingTransaction,
        orders,
        queryRunner,
      );
    }

    // 16. Update debt and receivable if applicable
    if (
      transactionType.name === 'Hutang' ||
      transactionType.name === 'Piutang'
    ) {
      const existingDebtReceivable =
        await this.debtsAndReceivablesRepository.findOne({
          where: { transaction: { id: transactionId } },
        });

      if (existingDebtReceivable) {
        existingDebtReceivable.dueDate = dueDate;
        existingDebtReceivable.creditor = creditor ? creditor : null;
        existingDebtReceivable.debtor = debtor ? debtor : null;

        await queryRunner.manager.save(existingDebtReceivable);
      } else {
        const newDebtReceivable = this.debtsAndReceivablesRepository.create({
          dueDate,
          status: 'pending',
          creditor: { id: creditor?.id },
          debtor: { id: debtor?.id },
          transaction: [existingTransaction],
        });
        await queryRunner.manager.save(newDebtReceivable);
      }
    }

    return await this.findTransactionById(transactionId, userId);
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

  private async validateAccountBalance(
    account: SubAccount,
    amount: number,
    position: 'debit' | 'credit',
  ): Promise<void> {
    if (position === 'debit') {
      // Jika akun di posisi debit, Liability dan Equity akan berkurang
      if (
        account.account.type === AccountType.LIABILITY ||
        account.account.type === AccountType.EQUITY
      ) {
        if (account.balance - amount < 0) {
          throw new BadRequestException(
            `Saldo akun ${account.name} tidak cukup untuk transaksi debit pada jenis Liability/Equity.`,
          );
        }
      }
    } else if (position === 'credit') {
      // Jika akun di posisi kredit, Asset dan Expense akan berkurang
      if (
        account.account.type === AccountType.ASSET ||
        account.account.type === AccountType.EXPENSE
      ) {
        if (account.balance - amount < 0) {
          throw new BadRequestException(
            `Saldo akun ${account.name} tidak cukup untuk transaksi kredit pada jenis Asset/Expense.`,
          );
        }
      }
    }
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

  async updateTransactionAddress(
    transaction: Transaction,
    address: {
      recipientName: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode: string;
      phoneNumber: string;
    },
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Cari alamat yang terkait dengan transaksi
    const existingAddress = await this.transactionContactRepository.findOneBy({
      transaction: { id: transaction.id },
    });

    if (existingAddress) {
      // Jika alamat ditemukan, perbarui
      await queryRunner.manager.update(TransactionContact, existingAddress.id, {
        ...address,
      });
    } else {
      // Jika alamat tidak ditemukan, buat yang baru
      const newAddress = this.transactionContactRepository.create({
        transaction: { id: transaction.id },
        ...address,
      });
      await queryRunner.manager.save(newAddress);
    }
  }

  async updateTransactionOrders(
    transaction: Transaction,
    orders: {
      productId: number;
      quantity: number;
    }[],
    queryRunner: QueryRunner,
  ): Promise<void> {
    // Hapus semua pesanan lama terkait transaksi
    await queryRunner.manager.delete(TransactionOrder, {
      transaction: { id: transaction.id },
    });

    await this.createTransactionOrders(transaction, orders, queryRunner);
  }

  async updateSubAccountBalance(
    amount: number,
    debitAccount: SubAccount,
    creditAccount: SubAccount,
    queryRunner: QueryRunner,
  ) {
    console.log('amount', amount);
    console.log('debitAccount', debitAccount);
    // Update the balance for the debit account
    const debitAccountBalanceImpact =
      debitAccount.account.normalBalance === BalanceImpactSide.DEBIT
        ? amount
        : -amount;
    console.log('debitAccountBalanceImpact', debitAccountBalanceImpact);
    const debitUpdated = await this.updateAccountBalance(
      debitAccount,
      debitAccountBalanceImpact,
      queryRunner,
    );

    // Update the balance for the credit account
    const creditAccountBalanceImpact =
      creditAccount.account.normalBalance === BalanceImpactSide.DEBIT
        ? -amount
        : amount;

    const creditUpdated = await this.updateAccountBalance(
      creditAccount,
      creditAccountBalanceImpact,
      queryRunner,
    );

    return { debitUpdated, creditUpdated };
  }

  async updateAccountBalance(
    subAccount: SubAccount,
    balanceImpact: number,
    queryRunner: QueryRunner,
  ) {
    // Fetch the current balance of the subAccount
    subAccount.balance += balanceImpact; // Adjust the balance
    console.log('subAccount now', subAccount);
    // Save the updated balance back to the database
    await queryRunner.manager.save(subAccount);
    return subAccount;
  }

  /**
   * Create transaction address
   */
  async createTransactionAddress(
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
    queryRunner: QueryRunner,
  ): Promise<void> {
    const transactionAddress = this.transactionContactRepository.create({
      ...address,
      transaction: { id: transaction.id },
    });

    await queryRunner.manager.save(transactionAddress);
  }

  async findTransactionById(transactionId: number, userId: string) {
    console.log('tes', userId);
    // 1. Validate existing transaction
    return await this.transactionRepository.findOne({
      where: { id: transactionId, user: { id: userId } },
      relations: [
        'debitAccount', // Relasi debitAccount
        'debitAccount.account', // Relasi lebih dalam ke account dari debitAccount
        'creditAccount', // Relasi creditAccount
        'creditAccount.account', // Relasi lebih dalam ke account dari creditAccount
        'store', // Relasi store
        'customer', // Relasi customer
        'user', // Relasi user
        'transactionType', // Relasi transactionType
        'transactionOrder', // Relasi transactionOrder
      ],
    });
  }
  /**
   * Create transaction details
   */
  async createTransactionOrders(
    transaction: Transaction,
    orders: {
      productId: number;
      quantity: number;
    }[],
    queryRunner: QueryRunner,
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
      const transactionDetail = this.transactionOrderRepository.create({
        transaction,
        productName: product.name,
        productSku: product.sku,
        unitPrice: product.price,
        quantity: detail.quantity,
        totalPrice,
      });
      await queryRunner.manager.save(transactionDetail);
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
