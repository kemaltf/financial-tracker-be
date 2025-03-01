import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv'; // Tambahkan dotenv untuk memuat file .env

dotenv.config({ path: '.env.development.local' });

console.log(process.env.DB_HOST);
console.log(process.env.DB_USERNAME);
console.log(process.env.DB_PASSWORD);
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: undefined, // Gunakan database default MySQL
});

(async () => {
  try {
    // Inisialisasi koneksi tanpa database khusus
    await AppDataSource.initialize();
    console.log('Connected to MySQL');

    // Buat database jika belum ada
    await AppDataSource.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`,
    );
    console.log(`Database "${process.env.DB_NAME}" created successfully!`);

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error creating database:', error);
  }
})();
