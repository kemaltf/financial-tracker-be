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
import { TransactionOrder } from './transaction-order/transaction-order.entity';
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

type GetTransactionHistoryParamType = {
  userId: string;
  startDateTime?: string;
  endDateTime?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
};
type GetFinancialSummaryParamType = {
  userId: string;
  startDateTime?: string;
  endDateTime?: string;
};

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
      subTotal: amount,
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
      subTotal: amount,
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

  /**
   * Get financial summary with optional filters
   */
  async getFinancialSummary({
    startDateTime,
    endDateTime,
    userId,
  }: GetFinancialSummaryParamType) {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.store', 'store')
      .where('user.id = :userId', { userId });

    // Optional start and end date filters
    if (startDateTime) {
      queryBuilder.andWhere('transaction.created_at >= :startMonth', {
        startMonth: startDateTime,
      });
    }

    if (endDateTime) {
      const endDateTimeLast = `${endDateTime} 23:59:59`;
      queryBuilder.andWhere('transaction.created_at <= :endMonth', {
        endMonth: endDateTimeLast,
      });
    }

    const totalIncome = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Pemasukan',
      })
      .select('SUM(transaction.amount)', 'totalIncome')
      .getRawOne();

    const totalExpense = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Pengeluaran',
      })
      .select('SUM(transaction.amount)', 'totalExpense')
      .getRawOne();

    const totalDebt = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Hutang',
      })
      .select('SUM(transaction.amount)', 'totalDebt')
      .getRawOne();

    const totalReceivables = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Piutang',
      })
      .select('SUM(transaction.amount)', 'totalReceivables')
      .getRawOne();

    const totalInvestment = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Tanam Modal',
      })
      .select('SUM(transaction.amount)', 'totalInvestment')
      .getRawOne();

    const totalWithdrawal = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Tarik Modal',
      })
      .select('SUM(transaction.amount)', 'totalWithdrawal')
      .getRawOne();

    const totalTransfer = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Transfer',
      })
      .select('SUM(transaction.amount)', 'totalTransfer')
      .getRawOne();

    const totalReceivablesIncome = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Pemasukan Piutang',
      })
      .select('SUM(transaction.amount)', 'totalReceivablesIncome')
      .getRawOne();

    const totalReceivablesExpense = await queryBuilder
      .andWhere('transactionType.name = :transactionType', {
        transactionType: 'Pengeluaran Piutang',
      })
      .select('SUM(transaction.amount)', 'totalReceivablesExpense')
      .getRawOne();

    // Extract the result from raw query
    const totalIncomeAmount = totalIncome?.totalIncome || 0;
    const totalExpenseAmount = totalExpense?.totalExpense || 0;
    const totalDebtAmount = totalDebt?.totalDebt || 0;
    const totalReceivablesAmount = totalReceivables?.totalReceivables || 0;
    const totalInvestmentAmount = totalInvestment?.totalInvestment || 0;
    const totalWithdrawalAmount = totalWithdrawal?.totalWithdrawal || 0;
    const totalTransferAmount = totalTransfer?.totalTransfer || 0;
    const totalReceivablesIncomeAmount =
      totalReceivablesIncome?.totalReceivablesIncome || 0;
    const totalReceivablesExpenseAmount =
      totalReceivablesExpense?.totalReceivablesExpense || 0;

    let prevTotalIncome,
      prevTotalExpense,
      prevTotalDebt,
      prevTotalReceivables,
      prevTotalInvestment,
      prevTotalWithdrawal,
      prevTotalTransfer,
      prevTotalReceivablesIncome,
      prevTotalReceivablesExpense;

    const isDateDefined = startDateTime && endDateTime ? true : false;

    if (isDateDefined) {
      // Query untuk bulan lalu
      const prevStartMonth = new Date(startDateTime);
      prevStartMonth.setMonth(prevStartMonth.getMonth() - 1);

      const prevEndMonth = new Date(endDateTime);
      prevEndMonth.setMonth(prevEndMonth.getMonth() - 1);

      const prevQueryBuilder = this.transactionRepository
        .createQueryBuilder('transaction')
        .leftJoinAndSelect('transaction.transactionType', 'transactionType')
        .leftJoinAndSelect('transaction.user', 'user')
        .leftJoinAndSelect('transaction.store', 'store')
        .where('user.id = :userId', { userId })
        .andWhere(
          'transaction.created_at BETWEEN :prevStartMonth AND :prevEndMonth',
          {
            prevStartMonth,
            prevEndMonth,
          },
        );

      prevTotalIncome = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Pemasukan',
        })
        .select('SUM(transaction.amount)', 'totalIncome')
        .getRawOne();

      prevTotalExpense = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Pengeluaran',
        })
        .select('SUM(transaction.amount)', 'totalExpense')
        .getRawOne();

      prevTotalDebt = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Hutang',
        })
        .select('SUM(transaction.amount)', 'totalDebt')
        .getRawOne();

      prevTotalReceivables = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Piutang',
        })
        .select('SUM(transaction.amount)', 'totalReceivables')
        .getRawOne();

      prevTotalInvestment = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Tanam Modal',
        })
        .select('SUM(transaction.amount)', 'totalInvestment')
        .getRawOne();

      prevTotalWithdrawal = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Tarik Modal',
        })
        .select('SUM(transaction.amount)', 'totalWithdrawal')
        .getRawOne();

      prevTotalTransfer = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Transfer',
        })
        .select('SUM(transaction.amount)', 'totalTransfer')
        .getRawOne();

      prevTotalReceivablesIncome = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Pemasukan Piutang',
        })
        .select('SUM(transaction.amount)', 'totalReceivablesIncome')
        .getRawOne();

      prevTotalReceivablesExpense = await prevQueryBuilder
        .andWhere('transactionType.name = :transactionType', {
          transactionType: 'Pengeluaran Piutang',
        })
        .select('SUM(transaction.amount)', 'totalReceivablesExpense')
        .getRawOne();
    }

    // Fungsi untuk menghitung persentase perubahan
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // Return Data
    return {
      totalIncome: Number(totalIncomeAmount),
      totalExpense: Number(totalExpenseAmount),
      totalDebt: Number(totalDebtAmount),
      totalReceivables: Number(totalReceivablesAmount),
      totalInvestment: Number(totalInvestmentAmount),
      totalWithdrawal: Number(totalWithdrawalAmount),
      totalTransfer: Number(totalTransferAmount),
      totalReceivablesIncome: Number(totalReceivablesIncomeAmount),
      totalReceivablesExpense: Number(totalReceivablesExpenseAmount),
      profitLoss: Number(totalIncomeAmount - totalExpenseAmount),

      // Persentase Perubahan
      totalIncomeChange: isDateDefined
        ? calculateChange(totalIncomeAmount, prevTotalIncome?.totalIncome || 0)
        : null,
      totalExpenseChange: isDateDefined
        ? calculateChange(
            totalExpenseAmount,
            prevTotalExpense?.totalExpense || 0,
          )
        : null,
      totalDebtChange: isDateDefined
        ? calculateChange(totalDebtAmount, prevTotalDebt?.totalDebt || 0)
        : null,
      totalReceivablesChange: isDateDefined
        ? calculateChange(
            totalReceivablesAmount,
            prevTotalReceivables?.totalReceivables || 0,
          )
        : null,
      totalInvestmentChange: isDateDefined
        ? calculateChange(
            totalInvestmentAmount,
            prevTotalInvestment?.totalInvestment || 0,
          )
        : null,
      totalWithdrawalChange: isDateDefined
        ? calculateChange(
            totalWithdrawalAmount,
            prevTotalWithdrawal?.totalWithdrawal || 0,
          )
        : null,
      totalTransferChange: isDateDefined
        ? calculateChange(
            totalTransferAmount,
            prevTotalTransfer?.totalTransfer || 0,
          )
        : null,
      totalReceivablesIncomeChange: isDateDefined
        ? calculateChange(
            totalReceivablesIncomeAmount,
            prevTotalReceivablesIncome?.totalReceivablesIncome || 0,
          )
        : null,
      totalReceivablesExpenseChange: isDateDefined
        ? calculateChange(
            totalReceivablesExpenseAmount,
            prevTotalReceivablesExpense?.totalReceivablesExpense || 0,
          )
        : null,
      profitLossChange: isDateDefined
        ? calculateChange(
            Number(totalIncomeAmount - totalExpenseAmount),
            Number(
              prevTotalIncome?.totalIncome - prevTotalExpense?.totalExpense,
            ),
          )
        : null,
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

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory({
    limit,
    page,
    userId,
    endDateTime,
    startDateTime,
    sortBy,
    sortDirection,
  }: GetTransactionHistoryParamType): Promise<{
    data: {
      id: number;
      note: string;
      createdAt: Date;
      transactionType: string;
      amount: number;
      store: string;
      user: string;
      debit: {
        code: string;
        account: string;
        balance: number;
      };
      credit: {
        code: string;
        account: string;
        balance: number;
      };
    }[];
    total: number;
    currentPage: number;
    totalPages: number;
    filter: { startMonth: string; endMonth: string };
  }> {
    // Check if sortBy is a valid column
    const sortableColumns = ['name', 'price', 'stock', 'createdAt'];
    if (!sortableColumns.includes(sortBy)) {
      throw new BadRequestException(
        `Invalid sortBy column. Allowed: ${sortableColumns.join(', ')}`,
      );
    }

    const offset = (page - 1) * limit;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.debitAccount', 'debitAccount')
      .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
      .leftJoinAndSelect('transaction.transactionContact', 'transactionContact')
      .leftJoinAndSelect('transaction.transactionOrder', 'transactionOrder')
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.store', 'store')
      .where('user.id = :userId', { userId });

    if (startDateTime) {
      queryBuilder.andWhere('transaction.created_at >= :startMonth', {
        startMonth: startDateTime,
      });
    }

    if (endDateTime) {
      const endDateTimeLast = `${endDateTime} 23:59:59`;
      queryBuilder.andWhere('transaction.created_at <= :endMonth', {
        endMonth: endDateTimeLast,
      });
    }

    const [transactions, total] = await queryBuilder
      .orderBy(`transaction.${sortBy}`, sortDirection)
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const mappedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      note: transaction.note,
      createdAt: transaction.createdAt,
      transactionType: transaction.transactionType.name,
      amount: transaction.amount,
      store: transaction.store.name,
      user: transaction.user.name,
      debit: {
        code: transaction.debitAccount.code,
        account: transaction.debitAccount.name,
        balance: transaction.debitAccount.balance,
      },
      credit: {
        code: transaction.creditAccount.code,
        account: transaction.creditAccount.name,
        balance: transaction.creditAccount.balance,
      },
    }));

    return {
      data: mappedTransactions,
      total,
      filter: {
        startMonth: startDateTime,
        endMonth: endDateTime,
      },
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transaction detail by ID
   */
  async getTransactionDetail(transactionId: number): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: [
        'transactionType',
        'debitAccount',
        'creditAccount',
        'transactionContact',
        'transactionOrder',
      ],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found.`,
      );
    }

    return transaction;
  }

  /**
   * Get Ledger (Buku Besar)
   */
  async getLedger(
    startMonth?: string,
    endMonth?: string,
    accountId?: number,
  ): Promise<any> {
    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.transactionType', 'transactionType')
      .leftJoinAndSelect('transaction.debitAccount', 'debitAccount')
      .leftJoinAndSelect('debitAccount.account', 'debitAccountType')
      .leftJoinAndSelect('transaction.creditAccount', 'creditAccount')
      .leftJoinAndSelect('creditAccount.account', 'creditAccountType')
      .orderBy('transaction.created_at', 'ASC');

    if (startMonth) {
      queryBuilder.andWhere('transaction.created_at >= :startMonth', {
        startMonth,
      });
    }

    if (endMonth) {
      queryBuilder.andWhere('transaction.created_at <= :endMonth', {
        endMonth,
      });
    }

    if (accountId) {
      queryBuilder.andWhere(
        '(transaction.debitAccountId = :accountId OR transaction.creditAccountId = :accountId)',
        { accountId },
      );
    }

    const transactions = await queryBuilder.getMany();

    console.log(transactions);
    const ledger = {};

    transactions.forEach((transaction) => {
      const debitAccountName = transaction.debitAccount.name;
      const creditAccountName = transaction.creditAccount.name;

      if (!ledger[debitAccountName]) {
        ledger[debitAccountName] = [];
      }
      if (!ledger[creditAccountName]) {
        ledger[creditAccountName] = [];
      }

      ledger[debitAccountName].push({
        date: transaction.createdAt,
        description: transaction.note,
        debit: transaction.amount,
        credit: 0,
        balance: 0, // Placeholder for balance calculation
        normalBalance: transaction.debitAccount.account.normalBalance,
      });

      ledger[creditAccountName].push({
        date: transaction.createdAt,
        description: transaction.note,
        debit: 0,
        credit: transaction.amount,
        balance: 0, // Placeholder for balance calculation
        normalBalance: transaction.creditAccount.account.normalBalance,
      });
    });

    // Calculate balance for each account
    Object.keys(ledger).forEach((accountName) => {
      let balance = 0;
      ledger[accountName] = ledger[accountName].map((entry) => {
        if (entry.normalBalance === 'DEBIT') {
          balance += entry.debit - entry.credit;
        } else {
          balance += entry.credit - entry.debit;
        }
        return { ...entry, balance };
      });
    });

    return ledger;
  }
  /**
   * Get Trial Balance (Neraca Saldo)
   */
  async getTrialBalance() {
    const accounts = await this.dataSource.query(`
      SELECT
        account.name,
        SUM(CASE WHEN t.debitAccountId = account.id THEN t.amount ELSE 0 END) AS debit,
        SUM(CASE WHEN t.creditAccountId = account.id THEN t.amount ELSE 0 END) AS credit
      FROM sub_accounts account
      LEFT JOIN transactions t ON t.debitAccountId = account.id OR t.creditAccountId = account.id
      GROUP BY account.name
    `);

    let totalDebit = 0;
    let totalCredit = 0;

    const trialBalance = accounts.map((account) => {
      totalDebit += parseFloat(account.debit);
      totalCredit += parseFloat(account.credit);
      return {
        name: account.name,
        debit: parseFloat(account.debit),
        credit: parseFloat(account.credit),
      };
    });

    return {
      trialBalance,
      totals: {
        totalDebit,
        totalCredit,
      },
    };
  }

  /**
   * Get Income Statement (Laporan Laba Rugi)
   */
  async getIncomeStatement(): Promise<any> {
    const income = await this.dataSource.query(`
      SELECT
        SUM(amount) AS totalIncome
      FROM transactions
      WHERE transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Pemasukan')
    `);

    const expenses = await this.dataSource.query(`
      SELECT
        SUM(amount) AS totalExpenses
      FROM transactions
      WHERE transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Pengeluaran')
    `);

    return {
      totalIncome: income[0].totalIncome,
      totalExpenses: expenses[0].totalExpenses,
      netIncome: income[0].totalIncome - expenses[0].totalExpenses,
    };
  }

  /**
   * Get Balance Sheet (Neraca)
   */
  async getBalanceSheet(): Promise<any> {
    const assets = await this.dataSource.query(`
      SELECT
        account.name,
        SUM(CASE WHEN t.debitAccountId = account.id THEN t.amount ELSE 0 END) -
        SUM(CASE WHEN t.creditAccountId = account.id THEN t.amount ELSE 0 END) AS total
      FROM sub_accounts account
      LEFT JOIN transactions t ON t.debitAccountId = account.id OR t.creditAccountId = account.id
      LEFT JOIN account a ON account.account_id = a.id
      WHERE a.type = 'ASSET'
      GROUP BY account.name
    `);

    const liabilities = await this.dataSource.query(`
     SELECT
      account.name,
      SUM(CASE WHEN t.creditAccountId = account.id THEN t.amount ELSE 0 END) -
      SUM(CASE WHEN t.debitAccountId = account.id THEN t.amount ELSE 0 END) AS total
    FROM sub_accounts account
    LEFT JOIN transactions t ON t.debitAccountId = account.id OR t.creditAccountId = account.id
    LEFT JOIN account a ON account.account_id = a.id
    WHERE a.type = 'LIABILITY'
    GROUP BY account.name
    `);

    const equity = await this.dataSource.query(`
     SELECT
      account.name,
      SUM(CASE WHEN t.creditAccountId = account.id THEN t.amount ELSE 0 END) -
      SUM(CASE WHEN t.debitAccountId = account.id THEN t.amount ELSE 0 END) AS total
    FROM sub_accounts account
    LEFT JOIN transactions t ON t.debitAccountId = account.id OR t.creditAccountId = account.id
    LEFT JOIN account a ON account.account_id = a.id
    WHERE a.type = 'EQUITY'
    GROUP BY account.name
    `);

    return {
      assets: assets.map((asset) => ({
        ...asset,
        total: parseFloat(asset.total), // Ensures total is treated as a number
      })),
      liabilities: liabilities.map((liability) => ({
        ...liability,
        total: parseFloat(liability.total), // Ensures total is treated as a number
      })),
      equity: equity.map((equityItem) => ({
        ...equityItem,
        total: parseFloat(equityItem.total), // Ensures total is treated as a number
      })),
    };
  }

  /**
   * Get Cash Flow Statement (Laporan Arus Kas)
   */
  async getCashFlowStatement(): Promise<any> {
    const cashInflow = await this.dataSource.query(`
      SELECT
      SUM(amount) AS totalInflow
      FROM transactions
      WHERE transaction_type_id = (SELECT id FROM transaction_types tt WHERE name = 'Pemasukan')
    `);

    const cashOutflow = await this.dataSource.query(`
      SELECT
        SUM(amount) AS totalOutflow
      FROM transactions
      WHERE transaction_type_id = (SELECT id FROM transaction_types WHERE name = 'Pengeluaran')
    `);

    return {
      totalInflow: cashInflow[0].totalInflow,
      totalOutflow: cashOutflow[0].totalOutflow,
      netCashFlow: cashInflow[0].totalInflow - cashOutflow[0].totalOutflow,
    };
  }
}
