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

    // transaksi itu pasti kan berhubungan sama wallet
    // Menemukan Wallet dan user nya ada ga?
    const wallet = await this.walletRepository.findOne({
      where: { id: walletId, user: { id: userId } },
    });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Tipe transaksinya apa? trf, pemasukan, debt ? dll
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
    await this.handleTransactionType(
      transaction,
      transactionType.name,
      wallet,
      amount,
      userId,
    );

    return transaction;
  }

  async handleTransactionType(
    transaction: Transaction,
    transactionTypeName: string,
    wallet: Wallet,
    amount: number,
    userId: string,
  ): Promise<void> {
    // Ambil akun-akun terkait
    const cashAccount = await this.accountRepository.findOne({
      where: { code: '101' },
    }); // Kas
    const incomeAccount = await this.accountRepository.findOne({
      where: { code: '401' },
    }); // Pendapatan
    const expenseAccount = await this.accountRepository.findOne({
      where: { code: '501' },
    }); // Beban
    const debtAccount = await this.accountRepository.findOne({
      where: { code: '201' },
    }); // Hutang
    const receivableAccount = await this.accountRepository.findOne({
      where: { code: '301' },
    }); // Piutang
    const equityAccount = await this.accountRepository.findOne({
      where: { code: '601' },
    }); // Modal

    if (
      !cashAccount ||
      !incomeAccount ||
      !expenseAccount ||
      !debtAccount ||
      !receivableAccount ||
      !equityAccount
    ) {
      throw new Error('Some accounts are missing in the database.');
    }

    const entries: AccountingEntry[] = [];
    const oldWalletState = { balance: wallet.balance }; // Catat saldo sebelum perubahan

    switch (transactionTypeName) {
      case 'Pemasukan':
        wallet.balance += amount; // Tambahkan saldo ke wallet
        entries.push(
          this.accountingEntryRepository.create({
            transaction,
            account: cashAccount,
            entry_type: 'DEBIT',
            amount,
            description: `Kas bertambah dari pemasukan untuk transaksi #${transaction.id}`,
          }),
          this.accountingEntryRepository.create({
            transaction,
            account: incomeAccount,
            entry_type: 'CREDIT',
            amount,
            description: `Pendapatan bertambah untuk transaksi #${transaction.id}`,
          }),
        );
        break;

      case 'Pengeluaran':
        if (wallet.balance < amount) {
          throw new Error('Insufficient wallet balance for this transaction.');
        }
        wallet.balance -= amount; // Kurangi saldo dari wallet
        entries.push(
          this.accountingEntryRepository.create({
            transaction,
            account: expenseAccount,
            entry_type: 'DEBIT',
            amount,
            description: `Beban bertambah untuk transaksi #${transaction.id}`,
          }),
          this.accountingEntryRepository.create({
            transaction,
            account: cashAccount,
            entry_type: 'CREDIT',
            amount,
            description: `Kas berkurang untuk transaksi #${transaction.id}`,
          }),
        );
        break;

      case 'Hutang':
        wallet.balance += amount; // Tambahkan saldo dari pencatatan hutang
        entries.push(
          this.accountingEntryRepository.create({
            transaction,
            account: debtAccount,
            entry_type: 'CREDIT',
            amount,
            description: `Hutang bertambah untuk transaksi #${transaction.id}`,
          }),
          this.accountingEntryRepository.create({
            transaction,
            account: cashAccount,
            entry_type: 'DEBIT',
            amount,
            description: `Kas bertambah dari pencatatan hutang untuk transaksi #${transaction.id}`,
          }),
        );
        break;

      case 'Piutang':
        if (wallet.balance < amount) {
          throw new Error('Insufficient wallet balance for this transaction.');
        }
        wallet.balance -= amount; // Kurangi saldo dari wallet
        entries.push(
          this.accountingEntryRepository.create({
            transaction,
            account: receivableAccount,
            entry_type: 'DEBIT',
            amount,
            description: `Piutang bertambah untuk transaksi #${transaction.id}`,
          }),
          this.accountingEntryRepository.create({
            transaction,
            account: incomeAccount,
            entry_type: 'CREDIT',
            amount,
            description: `Pendapatan bertambah untuk transaksi #${transaction.id}`,
          }),
        );
        break;

      case 'Tanam Modal':
        wallet.balance += amount; // Tambahkan saldo ke wallet dari modal
        entries.push(
          this.accountingEntryRepository.create({
            transaction,
            account: cashAccount,
            entry_type: 'DEBIT',
            amount,
            description: `Kas bertambah dari penambahan modal untuk transaksi #${transaction.id}`,
          }),
          this.accountingEntryRepository.create({
            transaction,
            account: equityAccount,
            entry_type: 'CREDIT',
            amount,
            description: `Ekuitas modal bertambah untuk transaksi #${transaction.id}`,
          }),
        );
        break;

      case 'Tarik Modal':
        if (wallet.balance < amount) {
          throw new Error('Insufficient wallet balance for this transaction.');
        }
        wallet.balance -= amount; // Kurangi saldo wallet dari modal
        entries.push(
          this.accountingEntryRepository.create({
            transaction,
            account: equityAccount,
            entry_type: 'DEBIT',
            amount,
            description: `Ekuitas modal berkurang untuk transaksi #${transaction.id}`,
          }),
          this.accountingEntryRepository.create({
            transaction,
            account: cashAccount,
            entry_type: 'CREDIT',
            amount,
            description: `Kas berkurang untuk transaksi #${transaction.id}`,
          }),
        );
        break;

      case 'Transfer':
        // Ambil rekening pengirim (wallet A)
        const senderWallet = await this.walletRepository.findOne({
          where: { id: transaction.wallet_id },
        });

        if (!senderWallet) {
          throw new Error('Sender wallet not found.');
        }

        // Periksa apakah ada wallet penerima (internal transfer)
        const receiverWallet = transaction.target_wallet_id
          ? await this.walletRepository.findOne({
              where: { id: transaction.target_wallet_id },
            })
          : null;

        if (receiverWallet) {
          // Internal transfer: transfer ke wallet lain dalam sistem
          // Pastikan saldo pengirim mencukupi
          if (senderWallet.balance < amount) {
            throw new Error('Insufficient balance in sender wallet.');
          }

          // Perbarui saldo untuk kedua wallet
          senderWallet.balance -= amount;
          receiverWallet.balance += amount;

          entries.push(
            this.accountingEntryRepository.create({
              transaction,
              account: cashAccount,
              entry_type: 'CREDIT',
              amount,
              description: `Kas berkurang dari transfer keluar dari wallet #${senderWallet.id} pada transaksi #${transaction.id}`,
            }),
            this.accountingEntryRepository.create({
              transaction,
              account: cashAccount,
              entry_type: 'DEBIT',
              amount,
              description: `Kas bertambah dari transfer masuk ke wallet #${receiverWallet.id} pada transaksi #${transaction.id}`,
            }),
          );

          // Simpan saldo wallet yang diperbarui
          await this.walletRepository.save(senderWallet);
          await this.walletRepository.save(receiverWallet);
        } else {
          // External transfer: transfer ke wallet eksternal (di luar sistem)
          if (senderWallet.balance < amount) {
            throw new Error('Insufficient balance in sender wallet.');
          }

          // Perbarui saldo pengirim saja
          senderWallet.balance -= amount;

          entries.push(
            this.accountingEntryRepository.create({
              transaction,
              account: cashAccount,
              entry_type: 'CREDIT',
              amount,
              description: `Kas berkurang dari transfer keluar ke pihak eksternal pada transaksi #${transaction.id}`,
            }),
          );

          // Simpan saldo wallet pengirim yang diperbarui
          await this.walletRepository.save(senderWallet);
        }
        break;

      default:
        throw new Error(`Unsupported transaction type: ${transactionTypeName}`);
    }

    // Simpan saldo wallet yang diperbarui
    await this.walletRepository.save(wallet);

    // Log perubahan wallet
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

    // Simpan entries ke database
    await this.accountingEntryRepository.save(entries);
  }
}
