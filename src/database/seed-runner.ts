import { DataSource } from 'typeorm';
import { SeederManager } from './seeders';
import { Transaction } from 'src/transaction/transaction.entity';

const AppDataSource = new DataSource({
  type: 'mysql', // or your DB type
  host: 'localhost', // your DB host
  port: 3306, // your DB port
  username: 'user', // your DB username
  password: 'password', // your DB password
  database: 'test', // your DB name
  entities: [Transaction],
  synchronize: true, // Jangan aktifkan di production
});

AppDataSource.initialize()
  .then(async () => {
    await SeederManager.run(AppDataSource);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Gagal menjalankan seeder:', error);
    process.exit(1);
  });
