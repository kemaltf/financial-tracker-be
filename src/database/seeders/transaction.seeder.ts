import { DataSource } from 'typeorm';
import { TransactionType } from '../../transaction/transactionType/transaction-type.entity';

export class TransactionTypeSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const transactionTypeRepository = dataSource.getRepository(TransactionType);

    // Hapus data yang ada sebelum seeding
    console.log('🔄 Menghapus data lama dari tabel...');
    await transactionTypeRepository.delete({});
    console.log('✅ Data lama berhasil dihapus.');

    // Reset auto-increment ID
    console.log('🔄 Mereset auto-increment ID...');
    await dataSource.query(
      'ALTER TABLE `transaction_types` AUTO_INCREMENT = 1',
    );
    console.log('✅ Auto-increment ID berhasil direset.');

    const seedData = [
      {
        name: 'Pemasukan',
        description: 'Transaksi untuk pemasukan uang',
        debit: ['ASSET'],
        credit: ['REVENUE'],
      },
      {
        name: 'Pengeluaran',
        description: 'Transaksi untuk pengeluaran uang',
        debit: ['EXPENSE'],
        credit: ['ASSET', 'EQUITY', 'LIABILITY'],
      },
      {
        name: 'Hutang',
        description: 'Transaksi untuk mencatat hutang',
        debit: ['ASSET'],
        credit: ['LIABILITY'],
      },
      {
        name: 'Piutang',
        description: 'Transaksi untuk mencatat piutang',
        debit: ['ASSET'],
        credit: ['REVENUE'],
      },
      {
        name: 'Tanam Modal',
        description: 'Transaksi untuk pencatatan investasi',
        debit: ['ASSET'],
        credit: ['EQUITY'],
      },
      {
        name: 'Tarik Modal',
        description: 'Transaksi untuk pengambilan modal',
        debit: ['EQUITY'],
        credit: ['ASSET'],
      },
      {
        name: 'Transfer',
        description: 'Transaksi untuk pemindahan antar rekening',
        debit: ['ASSET'],
        credit: ['ASSET'],
      },
      {
        name: 'Pemasukan Piutang',
        description: 'Transaksi untuk pemasukan dari piutang',
        debit: ['ASSET'],
        credit: ['EXPENSE'],
      },
      {
        name: 'Pengeluaran Piutang',
        description: 'Transaksi untuk pengeluaran terhadap piutang',
        debit: ['EXPENSE'],
        credit: ['ASSET'],
      },
    ];

    // Cek apakah data sudah ada untuk menghindari duplikasi
    for (const data of seedData) {
      const exists = await transactionTypeRepository.findOneBy({
        name: data.name,
      });
      if (!exists) {
        await transactionTypeRepository.save(data);
        console.log(`✅ Data seeder ditambahkan: ${data.name}`);
      } else {
        console.log(`⚠️ Data seeder sudah ada: ${data.name}`);
      }
    }
  }
}
