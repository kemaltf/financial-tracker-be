import { DataSource } from 'typeorm';
import { TransactionType } from '../../transactionType/transaction-type.entity';

export class TransactionSeeder {
  public static async run(dataSource: DataSource): Promise<void> {
    const transactionRepository = dataSource.getRepository(TransactionType);

    // await transactionRepository.clear();
    // Cek jika data sudah ada, jika sudah maka tidak diinsert
    const transactionCount = await transactionRepository.count();
    console.log(`⚠️ Data seeder sudah ada: ${transactionCount}`);

    const seedData = [
      { name: 'Pemasukan', description: 'Transaksi untuk pemasukan uang' },
      { name: 'Pengeluaran', description: 'Transaksi untuk pengeluaran uang' },
      { name: 'Hutang', description: 'Transaksi untuk mencatat hutang' },
      { name: 'Piutang', description: 'Transaksi untuk mencatat piutang' },
      {
        name: 'Tanam Modal',
        description: 'Transaksi untuk pencatatan investasi',
      },
      { name: 'Tarik Modal', description: 'Transaksi untuk pengambilan modal' },
      {
        name: 'Transfer',
        description: 'Transaksi untuk pemindahan antar rekening',
      },
      {
        name: 'Pemasukan Piutang',
        description: 'Transaksi untuk pemasukan dari piutang',
      },
      {
        name: 'Pengeluaran Piutang',
        description: 'Transaksi untuk pengeluaran terhadap piutang',
      },
    ];

    // Cek apakah data sudah ada untuk menghindari duplikasi
    for (const data of seedData) {
      const exists = await transactionRepository.findOneBy({ name: data.name });
      if (!exists) {
        await transactionRepository.save(data);
        console.log(`✅ Data seeder ditambahkan: ${data.name}`);
      } else {
        console.log(`⚠️ Data seeder sudah ada: ${data.name}`);
      }
    }
  }
}
