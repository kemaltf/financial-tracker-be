import { DataSource } from 'typeorm';
import { SubAccount } from '@app/account/sub-account.entity';
import {
  Account,
  AccountType,
  BalanceImpactSide,
} from '@app/account/account.entity'; // Pastikan Anda mengimpor Account model

export class AccountSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const subAccountRepository = dataSource.getRepository(SubAccount);
    const accountRepository = dataSource.getRepository(Account);

    // Hapus data yang ada sebelum seeding
    console.log('🔄 Menghapus data lama dari tabel...');
    await subAccountRepository.delete({});
    await accountRepository.delete({});
    console.log('✅ Data lama berhasil dihapus.');

    // Reset auto-increment ID
    console.log('🔄 Mereset auto-increment ID...');
    await dataSource.query('ALTER TABLE `account` AUTO_INCREMENT = 1');
    await dataSource.query('ALTER TABLE `sub_accounts` AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment ID berhasil direset.');

    const accounts = [
      {
        type: AccountType.ASSET,
        normalBalance: BalanceImpactSide.DEBIT,
      },
      {
        type: AccountType.LIABILITY,
        normalBalance: BalanceImpactSide.CREDIT,
      },
      {
        type: AccountType.REVENUE,
        normalBalance: BalanceImpactSide.CREDIT,
      },
      {
        type: AccountType.EXPENSE,
        normalBalance: BalanceImpactSide.DEBIT,
      },
      {
        type: AccountType.EQUITY,
        normalBalance: BalanceImpactSide.CREDIT,
      },
    ];

    // Menambahkan data ke dalam tabel account
    const accountSaved = await accountRepository.save(
      accounts.map((account) => ({
        type: account.type,
        normalBalance: account.normalBalance,
      })),
    );
    console.log(accountSaved);

    // // Data yang akan dimasukkan ke dalam tabel accounts
    // const subAccounts = [
    //   {
    //     code: '1-10001',
    //     name: 'Kas',
    //     type: AccountType.ASSET,
    //     description: 'Uang tunai di tangan',
    //   },
    //   {
    //     code: '1-10002',
    //     name: 'Rekening Bank',
    //     type: AccountType.ASSET,
    //     description: 'Saldo rekening bank',
    //   },
    //   {
    //     code: '1-102000',
    //     name: 'Persediaan Barang',
    //     type: AccountType.ASSET,
    //     description: 'Barang siap dijual',
    //   },
    //   {
    //     code: '4-40200',
    //     name: 'Pendapatan',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari penjualan produk',
    //   },
    //   {
    //     code: '5-50100',
    //     name: "Owner's Equity",
    //     type: AccountType.EQUITY,
    //     description: 'Modal pemilik',
    //   },
    //   {
    //     code: '4-30200',
    //     name: 'Advertising Revenue',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari iklan',
    //   },
    //   {
    //     code: '1-10100',
    //     name: 'Piutang Usaha',
    //     type: AccountType.ASSET,
    //     description: 'Piutang usaha dari pelanggan',
    //   },
    //   {
    //     code: '1-10101',
    //     name: 'Piutang Lain-lain (Other Receivables)',
    //     type: AccountType.ASSET,
    //     description:
    //       'Piutang yang berasal dari aktivitas non-operasional, seperti pinjaman kepada karyawan atau pihak lain.',
    //   },
    //   {
    //     code: '2-20100',
    //     name: 'Accounts Payable',
    //     type: AccountType.LIABILITY,
    //     description: 'Hutang usaha',
    //   },
    //   {
    //     code: '5-60100',
    //     name: 'Biaya Agen Sosial Media',
    //     type: AccountType.EXPENSE,
    //     description: 'Pembayaran kepada agen sosial media',
    //   },
    //   {
    //     code: '5-60200',
    //     name: 'Biaya Iklan',
    //     type: AccountType.EXPENSE,
    //     description: 'Biaya iklan dan pemasaran',
    //   },
    //   {
    //     code: '5-60300',
    //     name: 'Barang Pelengkap',
    //     type: AccountType.EXPENSE,
    //     description: 'Pembelian barang pelengkap seperti stiker',
    //   },
    //   {
    //     code: '5-60400',
    //     name: 'Barang Kantor',
    //     type: AccountType.EXPENSE,
    //     description: 'Pembelian barang kantor seperti printer',
    //   },
    //   {
    //     code: '5-60500',
    //     name: 'Biaya Transportasi',
    //     type: AccountType.EXPENSE,
    //     description: 'Biaya transportasi untuk operasional usaha',
    //   },
    //   {
    //     code: '4-30300',
    //     name: 'Affiliate Revenue',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari program afiliasi atau referensi.',
    //   },
    //   {
    //     code: '4-30400',
    //     name: 'Subscription Revenue',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari layanan berbasis langganan.',
    //   },
    //   {
    //     code: '4-30500',
    //     name: 'Digital Product Sales',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari penjualan produk digital seperti e-book, kursus online, atau template.',
    //   },

    //   {
    //     code: '4-30700',
    //     name: 'Marketplace Commission',
    //     type: AccountType.REVENUE,
    //     description: 'Komisi dari penjualan produk di marketplace online.',
    //   },
    //   {
    //     code: '4-30800',
    //     name: 'Dropshipping Revenue',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari model bisnis dropshipping.',
    //   },
    //   {
    //     code: '4-30900',
    //     name: 'Freemium Upsell Revenue',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari pelanggan yang meningkatkan layanan dari gratis ke berbayar.',
    //   },
    //   {
    //     code: '4-31000',
    //     name: 'Sponsored Content Revenue',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari konten bersponsor seperti posting blog, video, atau ulasan.',
    //   },
    //   {
    //     code: '4-31100',
    //     name: 'Event Ticket Sales',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari penjualan tiket acara online seperti webinar atau pelatihan.',
    //   },
    //   {
    //     code: '4-31200',
    //     name: 'Freelance Service Revenue',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari layanan freelance seperti desain grafis, penulisan, atau konsultasi.',
    //   },
    //   {
    //     code: '4-31300',
    //     name: 'White Labeling Revenue',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari produk atau layanan yang dijual dengan merek pelanggan.',
    //   },
    //   {
    //     code: '4-31400',
    //     name: 'Platform Usage Fees',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari biaya penggunaan platform, seperti layanan SaaS.',
    //   },
    //   {
    //     code: '4-31500',
    //     name: 'Course Enrollment Revenue',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari pendaftaran kursus online.',
    //   },
    //   {
    //     code: '4-31600',
    //     name: 'Reseller Revenue',
    //     type: AccountType.REVENUE,
    //     description:
    //       'Pendapatan dari penjualan kembali produk dengan margin keuntungan.',
    //   },
    //   {
    //     code: '4-31700',
    //     name: 'Consultation Fees',
    //     type: AccountType.REVENUE,
    //     description: 'Pendapatan dari layanan konsultasi bisnis atau teknis.',
    //   },
    // ];

    // // Menambahkan data ke dalam tabel sub-accounts
    // const savedAccounts = await subAccountRepository.save(
    //   subAccounts.map((account) => {
    //     const relatedAccount = accountSaved.find(
    //       (type) => type.type === account.type,
    //     );

    //     if (!relatedAccount) {
    //       throw new Error(
    //         `Account type ${account.type} not found in the saved accounts.`,
    //       );
    //     }

    //     console.log('first', relatedAccount);
    //     return {
    //       code: account.code,
    //       name: account.name,
    //       balance: 0,
    //       account: relatedAccount, // Menambahkan relasi AccountType
    //       description: account.description,
    //     };
    //   }),
    // );
    // console.log('saved', savedAccounts);

    console.log('✅ Account seeding completed!');
  }
}
