import { DataSource } from 'typeorm';
import { Account, type AccountType } from 'src/account/account.entity';

export class AccountSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const accountRepository = dataSource.getRepository(Account);

    // Cek jika data sudah ada, jika sudah maka tidak diinsert
    const accountsCount = await accountRepository.count();
    console.log(`⚠️ Data seeder sudah ada: ${accountsCount}`);

    if (accountsCount > 0) return;

    // Data yang akan dimasukkan ke dalam tabel accounts
    const accounts = [
      {
        name: 'Kas',
        type: 'ASSET' as AccountType,
        description: 'Saldo tunai perusahaan',
      },
      {
        name: 'Pendapatan Penjualan',
        type: 'REVENUE' as AccountType,
        description: 'Pendapatan dari penjualan produk',
      },
      {
        name: 'Biaya Operasional',
        type: 'EXPENSE' as AccountType,
        description: 'Biaya operasional seperti ongkir, bubble wrap, dll',
      },
      {
        name: 'Utang Jangka Panjang',
        type: 'LIABILITY' as AccountType,
        description: 'Kewajiban utang jangka panjang',
      },
      {
        name: 'Modal Pemilik',
        type: 'EQUITY' as AccountType,
        description: 'Modal yang ditanam oleh pemilik bisnis',
      },
      {
        name: 'Piutang dari Pembeli',
        type: 'ASSET' as AccountType,
        description: 'Piutang yang belum dibayar oleh pembeli',
      },
      {
        name: 'Pajak Penghasilan',
        type: 'EXPENSE' as AccountType,
        description: 'Biaya pajak yang dibayar ke negara',
      },
    ];

    // Menambahkan data ke dalam tabel accounts
    await accountRepository.save(accounts);

    console.log('✅ Account seeding completed!');
  }
}
