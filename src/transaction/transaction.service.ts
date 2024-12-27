import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { Wallet } from 'src/wallet/wallet.entity';
import { AccountingEntry } from 'src/accountingEntry/accounting_entry.entity';
import { TransactionDTO } from './dto/transaction.dto';
import { TransactionType } from './transactionType/transaction-type.entity';

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
  ) {}

  // Logic untuk membuat transaksi
  async createTransaction(
    userId: string,
    transactionDTO: TransactionDTO,
  ): Promise<Transaction> {
    const { walletId, transactionTypeId, amount, description } = transactionDTO;

    // Menemukan Wallet dan TransactionType berdasarkan ID
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
    });
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: transactionTypeId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }
    if (!transactionType) {
      throw new Error('Transaction type not found');
    }

    // Membuat transaksi baru
    const transaction = this.transactionRepository.create({
      user: { id: userId },
      wallet: { id: walletId },
      transactionType,
      amount,
      description,
      date: new Date(),
    });

    await this.transactionRepository.save(transaction);

    // Mengatur logika untuk transaksi berdasarkan jenis
    await this.handleTransactionType(transaction, amount, transactionType);

    return transaction;
  }

  async updateTransaction(
    transactionId: number,
    transactionDTO: TransactionDTO,
  ): Promise<Transaction> {
    const { walletId, transactionTypeId, amount, description } = transactionDTO;

    // Menemukan transaksi yang ingin diedit
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['wallet', 'transactionType'],
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Menemukan Wallet dan TransactionType baru berdasarkan ID
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
    });
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: transactionTypeId },
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }
    if (!transactionType) {
      throw new Error('Transaction type not found');
    }

    // Menghitung perbedaan saldo yang akan diupdate
    const balanceDifference = amount - transaction.amount;

    // Memperbarui transaksi
    transaction.wallet = wallet;
    transaction.transactionType = transactionType;
    transaction.amount = amount;
    transaction.description = description;

    await this.transactionRepository.save(transaction);

    // Mengatur logika untuk transaksi berdasarkan jenis
    await this.handleTransactionType(
      transaction,
      balanceDifference,
      transactionType,
    );

    return transaction;
  }

  // Menangani transaksi berdasarkan jenisnya
  private async handleTransactionType(
    transaction: Transaction,
    amount: number,
    transactionType: TransactionType,
  ) {
    switch (transactionType.name) {
      case 'Pemasukan':
        // Pemasukan berarti menambah saldo wallet
        await this.updateWalletBalance(transaction.wallet.id, amount);
        break;

      case 'Pengeluaran':
        // Pengeluaran berarti mengurangi saldo wallet
        await this.updateWalletBalance(transaction.wallet.id, -amount);
        break;

      case 'Hutang':
        // Menambahkan hutang ke dalam accounting entry
        await this.createAccountingEntry(transaction, 'CREDIT', amount);
        break;

      case 'Piutang':
        // Menambahkan piutang ke dalam accounting entry
        await this.createAccountingEntry(transaction, 'DEBIT', amount);
        break;

      case 'Tanam Modal':
        // Tanam modal, bisa menambah saldo atau mencatatkan investasi
        await this.createAccountingEntry(transaction, 'CREDIT', amount);
        break;

      case 'Tarik Modal':
        // Tarik modal, mengurangi saldo atau mencatat penarikan investasi
        await this.createAccountingEntry(transaction, 'DEBIT', amount);
        break;

      case 'Transfer':
        // Transfer, mencatat pengiriman dana ke wallet lain
        await this.handleTransfer(transaction, amount);
        break;

      case 'Pemasukan Piutang':
        // Pemasukan Piutang, mengonversi piutang menjadi pemasukan
        await this.updateWalletBalance(transaction.wallet.id, amount);
        await this.createAccountingEntry(transaction, 'DEBIT', amount);
        break;

      case 'Pengeluaran Piutang':
        // Pengeluaran Piutang, mencatat pengeluaran dari piutang
        await this.updateWalletBalance(transaction.wallet.id, -amount);
        await this.createAccountingEntry(transaction, 'CREDIT', amount);
        break;

      default:
        throw new Error('Unknown transaction type');
    }
  }

  // Update saldo wallet setelah transaksi
  private async updateWalletBalance(walletId: number, amount: number) {
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId },
    });
    wallet.balance += amount;
    await this.walletRepository.save(wallet);
  }

  // Menambahkan entry ke dalam accounting entries
  private async createAccountingEntry(
    transaction: Transaction,
    entryType: 'DEBIT' | 'CREDIT',
    amount: number,
  ) {
    const accountingEntry = this.accountingEntryRepository.create({
      transaction,
      entry_type: entryType,
      amount,
      description: transaction.description,
      entry_date: new Date(),
    });
    await this.accountingEntryRepository.save(accountingEntry);
  }

  // Handle transfer transaksi
  private async handleTransfer(transaction: Transaction, amount: number) {
    // Mengurangi saldo dari wallet pengirim
    await this.updateWalletBalance(transaction.wallet.id, -amount);
    // Mencatatkan transaksi pada wallet tujuan (wallet lain)
    // Misalnya kita mendapatkan wallet tujuan berdasarkan data yang sudah ada
    // const destinationWallet = await this.getDestinationWallet();
    // await this.updateWalletBalance(destinationWallet.id, amount);
  }
}
