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
        balanceImpact: BalanceImpactSide.DEBIT,
      },
      {
        type: AccountType.LIABILITY,
        balanceImpact: BalanceImpactSide.CREDIT,
      },
      {
        type: AccountType.REVENUE,
        balanceImpact: BalanceImpactSide.CREDIT,
      },
      {
        type: AccountType.EXPENSE,
        balanceImpact: BalanceImpactSide.DEBIT,
      },
      {
        type: AccountType.EQUITY,
        balanceImpact: BalanceImpactSide.CREDIT,
      },
    ];

    // Menambahkan data ke dalam tabel account
    const accountSaved = await accountRepository.save(
      accounts.map((account) => ({
        type: account.type,
        balanceImpact: account.balanceImpact,
      })),
    );
    console.log(accountSaved);

    // Data yang akan dimasukkan ke dalam tabel accounts
    const subAccounts = [
      {
        code: '1-10001',
        name: 'Kas',
        type: AccountType.ASSET,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Uang tunai di tangan',
      },
      {
        code: '1-10002',
        name: 'Rekening Bank',
        type: AccountType.ASSET,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Saldo rekening bank',
      },
      {
        code: '1-102000',
        name: 'Persediaan Barang',
        type: AccountType.ASSET,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Barang siap dijual',
      },
      {
        code: '4-40200',
        name: 'Pendapatan',
        type: AccountType.REVENUE,
        balanceImpact: BalanceImpactSide.CREDIT, // Tambahkan balanceImpact
        description: 'Pendapatan dari penjualan produk',
      },
      {
        code: '5-50100',
        name: "Owner's Equity",
        type: AccountType.EQUITY,
        balanceImpact: BalanceImpactSide.CREDIT, // Tambahkan balanceImpact
        description: 'Modal pemilik',
      },
      {
        code: '4-30200',
        name: 'Advertising Revenue',
        type: AccountType.REVENUE,
        balanceImpact: BalanceImpactSide.CREDIT, // Tambahkan balanceImpact
        description: 'Pendapatan dari iklan',
      },
      {
        code: '1-10100',
        name: 'Piutang Usaha',
        type: AccountType.ASSET,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Piutang usaha dari pelanggan',
      },
      {
        code: '1-10101',
        name: 'Piutang Lain-lain (Other Receivables)',
        type: AccountType.ASSET,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description:
          'Piutang yang berasal dari aktivitas non-operasional, seperti pinjaman kepada karyawan atau pihak lain.',
      },
      {
        code: '2-20100',
        name: 'Accounts Payable',
        type: AccountType.LIABILITY,
        balanceImpact: BalanceImpactSide.CREDIT, // Tambahkan balanceImpact
        description: 'Hutang usaha',
      },
      {
        code: '5-60100',
        name: 'Biaya Agen Sosial Media',
        type: AccountType.EXPENSE,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Pembayaran kepada agen sosial media',
      },
      {
        code: '5-60200',
        name: 'Biaya Iklan',
        type: AccountType.EXPENSE,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Biaya iklan dan pemasaran',
      },
      {
        code: '5-60300',
        name: 'Barang Pelengkap',
        type: AccountType.EXPENSE,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Pembelian barang pelengkap seperti stiker',
      },
      {
        code: '5-60400',
        name: 'Barang Kantor',
        type: AccountType.EXPENSE,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Pembelian barang kantor seperti printer',
      },
      {
        code: '5-60500',
        name: 'Biaya Transportasi',
        type: AccountType.EXPENSE,
        balanceImpact: BalanceImpactSide.DEBIT, // Tambahkan balanceImpact
        description: 'Biaya transportasi untuk operasional usaha',
      },
    ];

    // Menambahkan data ke dalam tabel sub-accounts
    const savedAccounts = await subAccountRepository.save(
      subAccounts.map((account) => {
        const relatedAccount = accountSaved.find(
          (type) => type.type === account.type,
        );

        if (!relatedAccount) {
          throw new Error(
            `Account type ${account.type} not found in the saved accounts.`,
          );
        }

        console.log('first', relatedAccount);
        return {
          code: account.code,
          name: account.name,
          account: relatedAccount, // Menambahkan relasi AccountType
          description: account.description,
        };
      }),
    );
    console.log('saved', savedAccounts);

    console.log('✅ Account seeding completed!');
  }
}
