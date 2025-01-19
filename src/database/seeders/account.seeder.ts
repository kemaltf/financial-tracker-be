import { DataSource } from 'typeorm';
import {
  SubAccount,
  AccountType,
  AccountCategory,
} from '@app/account/sub-account.entity';

export class AccountSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const accountRepository = dataSource.getRepository(SubAccount);

    // Cek jika data sudah ada, jika sudah maka tidak diinsert
    const accountsCount = await accountRepository.count();
    console.log(`⚠️ Data seeder sudah ada: ${accountsCount}`);

    if (accountsCount > 0) return;

    // Data yang akan dimasukkan ke dalam tabel accounts
    const accounts = [
      {
        code: '1-10001',
        name: 'Kas',
        type: AccountType.ASSET,
        category: AccountCategory.CASH_BANK,
        description: 'Uang tunai di tangan',
        parentId: null,
      },
      {
        code: '1-10002',
        name: 'Rekening Bank',
        type: AccountType.ASSET,
        category: AccountCategory.CASH_BANK,
        description: 'Saldo rekening bank',
        parentId: '1-10001', // Parentnya adalah "Kas"
      },
      {
        code: '1-102000',
        name: 'Persediaan Barang',
        type: AccountType.ASSET,
        category: AccountCategory.INVENTORY,
        description: 'Barang siap dijual',
        parentId: null,
      },
      {
        code: '4-40200',
        name: 'Pendapatan',
        type: AccountType.REVENUE,
        category: AccountCategory.REVENUE,
        description: 'Pendapatan dari penjualan produk',
        parentId: null,
      },
      {
        code: '5-50100',
        name: "Owner's Equity",
        type: AccountType.EQUITY,
        category: AccountCategory.EQUITY,
        description: 'Modal pemilik',
        parentId: null,
      },
      {
        code: '4-30200',
        name: 'Advertising Revenue',
        type: AccountType.REVENUE,
        category: AccountCategory.REVENUE,
        description: 'Pendapatan dari iklan',
      },
      {
        code: '1-10100',
        name: 'Piutang Usaha',
        type: AccountType.ASSET,
        category: AccountCategory.ACCOUNTS_RECEIVABLE,
        description: 'Piutang usaha dari pelanggan',
      },
      {
        code: '1-10101',
        name: 'Piutang Lain-lain (Other Receivables)',
        type: AccountType.ASSET,
        category: AccountCategory.ACCOUNTS_RECEIVABLE,
        description:
          'Piutang yang berasal dari aktivitas non-operasional, seperti pinjaman kepada karyawan atau pihak lain.',
      },
      {
        code: '2-20100',
        name: 'Accounts Payable',
        type: AccountType.LIABILITY,
        category: AccountCategory.ACCOUNTS_PAYABLE,
        description: 'Hutang usaha',
      },
      {
        code: '5-60100',
        name: 'Biaya Agen Sosial Media',
        type: AccountType.EXPENSE,
        category: AccountCategory.EXPENSE,
        description: 'Pembayaran kepada agen sosial media',
      },
      {
        code: '5-60200',
        name: 'Biaya Iklan',
        type: AccountType.EXPENSE,
        category: AccountCategory.EXPENSE,
        description: 'Biaya iklan dan pemasaran',
      },
      {
        code: '5-60300',
        name: 'Barang Pelengkap',
        type: AccountType.EXPENSE,
        category: AccountCategory.EXPENSE,
        description: 'Pembelian barang pelengkap seperti stiker',
      },
      {
        code: '5-60400',
        name: 'Barang Kantor',
        type: AccountType.EXPENSE,
        category: AccountCategory.EXPENSE,
        description: 'Pembelian barang kantor seperti printer',
      },
      {
        code: '5-60500',
        name: 'Biaya Transportasi',
        type: AccountType.EXPENSE,
        category: AccountCategory.EXPENSE,
        description: 'Biaya transportasi untuk operasional usaha',
      },
    ];

    // Menambahkan data ke dalam tabel accounts
    const savedAccounts = await accountRepository.save(accounts);

    // Membuat hubungan parent-child setelah akun disimpan
    savedAccounts.forEach((account) => {
      if (account.parentId) {
        const parentAccount = savedAccounts.find(
          (acc) => acc.code === account.parentId,
        );
        if (parentAccount) {
          account.parent = parentAccount;
        }
      }
    });

    console.log('saved', savedAccounts);

    // Menyimpan kembali dengan relasi parent-child yang telah ditetapkan
    await accountRepository.save(savedAccounts);

    console.log('✅ Account seeding completed!');
  }
}
