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
import { TransactionLog } from './transactionLogs/transaction-log.entity';

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
    @InjectRepository(TransactionLog)
    private readonly transactionLogRepository: Repository<TransactionLog>,
  ) {}

  private async getAccountByCode(code: string): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { code } });
    if (!account) {
      throw new Error(`Account with code ${code} not found`);
    }
    return account;
  }

  private async checkWalletBalance(
    wallet: Wallet,
    amount: number,
  ): Promise<void> {
    if (wallet.balance < amount) {
      throw new BadRequestException(
        'Insufficient balance for this transaction',
      );
    }
  }

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

  private isDebitTransaction(transactionTypeName: string): boolean {
    const debitTransactionTypes = [
      'Pengeluaran',
      'Pengeluaran Piutang',
      'Tarik Modal',
      'Transfer',
    ];
    return debitTransactionTypes.includes(transactionTypeName);
  }

  // Logic untuk membuat transaksi MANUAL
  // Transaksi itu ada beberapa tipe transaksi
  // pertama user akan memilih tipe transaksinya jenisnya apa?
  // kemudian user akan memilih wallet transaksinya dimana?
  // kemudian akan di proses logikanya di bagian ini
  async createTransaction(
    userId: string,
    transactionDTO: TransactionDTO,
  ): Promise<Transaction> {
    const {
      walletId,
      transactionTypeId,
      amount,
      description,
      address,
      details,
      storeId,
    } = transactionDTO;

    // validasi wallet dan usernya, apakah user berhak mengakses wallet ini?
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, users: { id: userId } },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Cari jenis tipe transaksinya apa?
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: transactionTypeId },
    });
    if (!transactionType) {
      throw new NotFoundException('Transaction type not found');
    }

    // Validate wallet balance if it's a debit transaction
    if (
      this.isDebitTransaction(transactionType.name) &&
      wallet.balance < amount
    ) {
      throw new BadRequestException(
        'Insufficient balance for this transaction',
      );
    }

    const transaction = this.transactionRepository.create({
      user: { id: userId },
      wallet: { id: walletId },
      transactionType,
      amount,
      description,
      date: new Date(),
      store: { id: storeId },
    });
    await this.transactionRepository.save(transaction);

    // Process address if provided
    if (address) {
      await this.processAddress(transaction, address);
    }

    // Process transaction details if provided
    if (details && details.length > 0) {
      await this.processTransactionDetails(transaction, details);
    }

    // Handle the transaction logic based on its type
    await this.handleTransactionType(
      transaction,
      transactionType.name,
      wallet,
      amount,
      userId,
    );

    return transaction;
  }

  private async processAddress(
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

  private async processTransactionDetails(
    transaction: Transaction,
    details: any[],
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

  async handleTransactionType(
    transaction: Transaction,
    transactionTypeName: string,
    wallet: Wallet,
    amount: number,
    userId: string,
  ): Promise<void> {
    const cashAccount = await this.getAccountByCode('101');
    const incomeAccount = await this.getAccountByCode('401');
    const expenseAccount = await this.getAccountByCode('501');
    const debtAccount = await this.getAccountByCode('201');
    const receivableAccount = await this.getAccountByCode('301');
    const equityAccount = await this.getAccountByCode('601');

    const entries: AccountingEntry[] = [];
    const oldWalletState = { balance: wallet.balance };

    switch (transactionTypeName) {
      case 'Pemasukan':
        wallet.balance += amount;
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
        await this.checkWalletBalance(wallet, amount);
        wallet.balance -= amount;
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
        wallet.balance += amount;
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
        await this.checkWalletBalance(wallet, amount);
        wallet.balance -= amount;
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
        wallet.balance += amount;
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
        await this.checkWalletBalance(wallet, amount);
        wallet.balance -= amount;
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
        await this.handleTransfer(transaction, wallet, amount);
        break;

      default:
        throw new Error(`Unsupported transaction type: ${transactionTypeName}`);
    }

    await this.walletRepository.save(wallet);
    const newWalletState = { balance: wallet.balance };
    await this.transactionLogRepository.save(
      this.transactionLogRepository.create({
        action: 'Update',
        oldValue: oldWalletState,
        newValue: newWalletState,
        transaction,
        performed_by: userId,
      }),
    );

    await this.accountingEntryRepository.save(entries);
  }

  private async handleTransfer(
    transaction: Transaction,
    wallet: Wallet,
    amount: number,
  ): Promise<void> {
    // Assuming transfer involves two wallets: source (wallet) and destination wallet
    const destinationWalletId = transaction.target_wallet_id; // This should come from the transaction DTO
    const destinationWallet = await this.walletRepository.findOne({
      where: { id: destinationWalletId },
    });

    if (!destinationWallet) {
      throw new NotFoundException('Destination wallet not found');
    }

    // Check if the source wallet has enough balance for the transfer
    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance for the transfer');
    }

    // Deduct the amount from the source wallet
    wallet.balance -= amount;
    await this.walletRepository.save(wallet);

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
        `Transferred to wallet ${destinationWalletId} for transaction #${transaction.id}`,
      ),
      this.createAccountingEntry(
        transaction,
        destinationAccount,
        'DEBIT',
        amount,
        `Transferred from wallet ${wallet.id} for transaction #${transaction.id}`,
      ),
    ];

    // Save accounting entries
    await this.accountingEntryRepository.save(entries);

    // Optionally, log the transfer action in a transaction log
    const oldWalletState = { balance: wallet.balance };
    const newWalletState = { balance: destinationWallet.balance };
    await this.transactionLogRepository.save(
      this.transactionLogRepository.create({
        action: 'Transfer',
        oldValue: oldWalletState,
        newValue: newWalletState,
        transaction,
      }),
    );
  }
}
