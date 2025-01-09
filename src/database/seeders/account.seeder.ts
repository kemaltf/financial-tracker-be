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
        code: '101',
        name: 'Kas',
        type: 'ASSET' as AccountType,
        description: 'Uang tunai dan setara kas',
      },
      {
        code: '102',
        name: 'Bank',
        type: 'ASSET' as AccountType,
        description: 'Saldo di rekening bank',
      },
      {
        code: '103',
        name: 'Piutang Usaha',
        type: 'ASSET' as AccountType,
        description: 'Piutang dari pelanggan',
      },
      {
        code: '201',
        name: 'Hutang Usaha',
        type: 'LIABILITY' as AccountType,
        description: 'Kewajiban kepada kreditur',
      },
      {
        code: '301',
        name: 'Modal Pemilik',
        type: 'EQUITY' as AccountType,
        description: 'Investasi pemilik dalam bisnis',
      },
      {
        code: '401',
        name: 'Pendapatan Usaha',
        type: 'REVENUE' as AccountType,
        description: 'Pendapatan dari operasional',
      },
      {
        code: '501',
        name: 'Beban Operasional',
        type: 'EXPENSE' as AccountType,
        description: 'Biaya-biaya operasional bisnis',
      },
      {
        code: '601',
        name: 'Beban Pajak',
        type: 'EXPENSE' as AccountType,
        description: 'Beban pajak penghasilan',
      },
      {
        code: '701',
        name: 'E-Wallet',
        type: 'ASSET' as AccountType,
        description: 'Saldo di e-wallet untuk transaksi digital',
      },
    ];

    // Menambahkan data ke dalam tabel accounts
    await accountRepository.save(accounts);

    console.log('✅ Account seeding completed!');
  }
}
