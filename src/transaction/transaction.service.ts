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
// import { Account } from '@app/account/account.entity';
import { TransactionAddress } from './transactionAddress/transaction-address.entity';
import { TransactionDetail } from './transactionDetail/transaction-detail.entity';
import { Product } from '@app/product/entity/product.entity';

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
  ) {}

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

    // Menemukan Wallet dan user nya ada ga?
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, user: { id: userId } },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Dan TransactionType berdasarkan ID
    const transactionType = await this.transactionTypeRepository.findOne({
      where: { id: transactionTypeId },
    });
    if (!transactionType) {
      throw new NotFoundException('Transaction type not found');
    }

    // Mengecek jika transaksi adalah pengeluaran atau transaksi yang mengurangi saldo
    if (
      this.isDebitTransaction(transactionType.name) &&
      wallet.balance < amount
    ) {
      // Mengembalikan error ke client melalui response API
      throw new BadRequestException(
        'Insufficient balance for this transaction',
      );
    }

    // Membuat transaksi baru
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

    // Simpan alamat jika data address disertakan
    if (address) {
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

    // Proses details jika ada
    if (details && details.length > 0) {
      for (const detail of details) {
        const product = await this.productRepository.findOne({
          where: { id: detail.productId },
        });
        if (!product)
          throw new NotFoundException(
            `Product with ID ${detail.productId} not found`,
          );

        const totalPrice = product.price * detail.quantity; // Menghitung total harga per produk
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

    // Mengatur logika untuk transaksi berdasarkan jenis
    // await this.handleTransactionTypeCreate(
    //   transaction,
    //   amount,
    //   transactionType,
    // );

    return transaction;
  }

  // async updateTransaction(
  //   userId: string,
  //   transactionId: number,
  //   transactionDTO: TransactionDTO,
  // ): Promise<Transaction> {
  //   const { walletId, transactionTypeId, amount, description } = transactionDTO;

  //   // Menemukan transaksi yang ingin diedit
  //   const transaction = await this.transactionRepository.findOne({
  //     where: { id: transactionId, user: { id: userId } },
  //     relations: ['wallet', 'transactionType'],
  //   });

  //   if (!transaction) {
  //     throw new NotFoundException('Transaction not found');
  //   }

  //   // Menemukan Wallet dan TransactionType baru berdasarkan ID
  //   const wallet = await this.walletRepository.findOne({
  //     where: { id: walletId },
  //   });
  //   const transactionType = await this.transactionTypeRepository.findOne({
  //     where: { id: transactionTypeId },
  //   });

  //   if (!wallet) {
  //     throw new Error('Wallet not found');
  //   }
  //   if (!transactionType) {
  //     throw new Error('Transaction type not found');
  //   }

  //   // Menghitung perbedaan saldo yang akan diupdate
  //   const balanceDifference = amount - transaction.amount;

  //   // Memperbarui transaksi
  //   transaction.wallet = wallet;
  //   transaction.transactionType = transactionType;
  //   transaction.amount = amount;
  //   transaction.description = description;

  //   await this.transactionRepository.save(transaction);

  //   // Mengatur logika untuk transaksi berdasarkan jenis
  //   await this.handleTransactionTypeUpdate(
  //     transaction,
  //     balanceDifference,
  //     transactionType,
  //   );

  //   return transaction;
  // }

  // Mengecek apakah transaksi termasuk dalam debit (pengeluaran)

  // private async handleTransactionTypeUpdate(
  //   transaction: Transaction,
  //   amountDifference: number,
  //   transactionType: TransactionType,
  // ) {
  //   switch (transactionType.name) {
  //     case 'Pemasukan':
  //       // Pemasukan berarti menambah saldo wallet
  //       await this.updateWalletBalance(transaction.wallet.id, amountDifference);
  //       break;

  //     case 'Pengeluaran':
  //       // Pengeluaran berarti mengurangi saldo wallet
  //       await this.updateWalletBalance(transaction.wallet.id, amountDifference);
  //       break;

  //     case 'Hutang':
  //       // Menambahkan hutang ke dalam accounting entry
  //       await this.createAccountingEntry(
  //         transaction,
  //         'CREDIT',
  //         amountDifference,
  //       );
  //       break;

  //     case 'Piutang':
  //       // Menambahkan piutang ke dalam accounting entry
  //       await this.createAccountingEntry(
  //         transaction,
  //         'DEBIT',
  //         amountDifference,
  //       );
  //       break;

  //     case 'Tanam Modal':
  //       // Tanam modal, bisa menambah saldo atau mencatatkan investasi
  //       await this.createAccountingEntry(
  //         transaction,
  //         'CREDIT',
  //         amountDifference,
  //       );
  //       break;

  //     case 'Tarik Modal':
  //       // Tarik modal, mengurangi saldo atau mencatat penarikan investasi
  //       await this.createAccountingEntry(
  //         transaction,
  //         'DEBIT',
  //         amountDifference,
  //       );
  //       break;

  //     case 'Transfer':
  //       // Transfer, mencatat pengiriman dana ke wallet lain
  //       await this.handleTransfer(transaction, amountDifference);
  //       break;

  //     case 'Pemasukan Piutang':
  //       // Pemasukan Piutang, mengonversi piutang menjadi pemasukan
  //       await this.updateWalletBalance(transaction.wallet.id, amountDifference);
  //       await this.createAccountingEntry(
  //         transaction,
  //         'DEBIT',
  //         amountDifference,
  //       );
  //       break;

  //     case 'Pengeluaran Piutang':
  //       // Pengeluaran Piutang, mencatat pengeluaran dari piutang
  //       await this.updateWalletBalance(transaction.wallet.id, amountDifference);
  //       await this.createAccountingEntry(
  //         transaction,
  //         'CREDIT',
  //         amountDifference,
  //       );
  //       break;

  //     default:
  //       throw new Error('Unknown transaction type');
  //   }
  // }

  // private async handleTransactionTypeCreate(
  //   transaction: Transaction,
  //   amount: number,
  //   transactionType: TransactionType,
  // ) {
  //   console.log(transactionType.name);

  //   // Mendapatkan account terkait
  //   const account = await this.getAccountByTransaction(transaction);

  //   switch (transactionType.name) {
  //     case 'Pemasukan':
  //       // Pemasukan berarti menambah saldo wallet
  //       await this.updateWalletBalance(transaction.wallet.id, amount);
  //       await this.createAccountingEntry(transaction, account, 'DEBIT', amount);
  //       break;

  //     case 'Pengeluaran':
  //       // Pengeluaran berarti mengurangi saldo wallet
  //       await this.updateWalletBalance(transaction.wallet.id, -amount);
  //       await this.createAccountingEntry(
  //         transaction,
  //         account,
  //         'CREDIT',
  //         amount,
  //       );
  //       break;

  //     case 'Hutang':
  //       // Menambahkan hutang ke dalam accounting entry
  //       await this.createAccountingEntry(
  //         transaction,
  //         account,
  //         'CREDIT',
  //         amount,
  //       );
  //       break;

  //     case 'Piutang':
  //       // Menambahkan piutang ke dalam accounting entry
  //       await this.createAccountingEntry(transaction, account, 'DEBIT', amount);
  //       break;

  //     case 'Tanam Modal':
  //       // Tanam modal, mencatatkan investasi
  //       await this.createAccountingEntry(
  //         transaction,
  //         account,
  //         'CREDIT',
  //         amount,
  //       );
  //       break;

  //     case 'Tarik Modal':
  //       // Tarik modal, mencatat penarikan investasi
  //       await this.createAccountingEntry(transaction, account, 'DEBIT', amount);
  //       break;

  //     case 'Transfer':
  //       // Transfer, mencatat pengiriman dana ke wallet lain
  //       await this.handleTransfer(transaction, amount);
  //       await this.createAccountingEntry(
  //         transaction,
  //         account,
  //         'CREDIT',
  //         amount,
  //       );
  //       break;

  //     case 'Pemasukan Piutang':
  //       // Pemasukan Piutang, mengonversi piutang menjadi pemasukan
  //       await this.updateWalletBalance(transaction.wallet.id, amount);
  //       await this.createAccountingEntry(transaction, account, 'DEBIT', amount);
  //       break;

  //     case 'Pengeluaran Piutang':
  //       // Pengeluaran Piutang, mencatat pengeluaran dari piutang
  //       await this.updateWalletBalance(transaction.wallet.id, -amount);
  //       await this.createAccountingEntry(
  //         transaction,
  //         account,
  //         'CREDIT',
  //         amount,
  //       );
  //       break;

  //     default:
  //       throw new Error('Unknown transaction type');
  //   }
  // }

  // Update saldo wallet setelah transaksi
  // private async updateWalletBalance(walletId: number, amount: number) {
  //   console.log('tes', walletId, amount);
  //   const wallet = await this.walletRepository.findOne({
  //     where: { id: walletId },
  //   });
  //   // Convert wallet.balance to number before performing the addition
  //   const currentBalance = parseFloat(wallet.balance.toString());

  //   // Perform the addition and set it with toFixed to maintain the desired precision
  //   wallet.balance = currentBalance + amount; // Ensure it's always two decimal places

  //   console.log('====>', wallet);
  //   await this.walletRepository.save(wallet);
  // }

  // Menambahkan entry ke dalam accounting entries
  // private async createAccountingEntry(
  //   transaction: Transaction,
  //   account: Account, // Tambahkan account sebagai parameter
  //   entryType: 'DEBIT' | 'CREDIT',
  //   amount: number,
  // ) {
  //   const accountingEntry = this.accountingEntryRepository.create({
  //     transaction,
  //     account, // Masukkan account ke dalam entri
  //     entry_type: entryType,
  //     amount,
  //     description: transaction.description,
  //     entry_date: new Date(),
  //   });
  //   console.log('SINI?', accountingEntry);
  //   await this.accountingEntryRepository.save(accountingEntry);
  // }
}
