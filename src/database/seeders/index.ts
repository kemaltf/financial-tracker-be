import { DataSource } from 'typeorm';
import { TransactionSeeder } from './transaction.seeder';
import { AccountSeeder } from './account.seeder';

export class SeederManager {
  public static async run(dataSource: DataSource): Promise<void> {
    console.log('🔄 Menjalankan semua seeder...');

    // Daftar seeder yang ingin dijalankan
    // const seeders = [TransactionSeeder, AccountSeeder];
    const seeders = [TransactionSeeder, AccountSeeder];

    for (const Seeder of seeders) {
      console.log(`🚀 Menjalankan seeder: ${Seeder.name}`);
      await Seeder.run(dataSource);
    }

    console.log('✅ Semua seeder selesai dijalankan.');
  }
}
