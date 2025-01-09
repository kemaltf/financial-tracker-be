import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv'; // Tambahkan dotenv untuk memuat file .env

// Pastikan file .env dimuat secara manual
dotenv.config({ path: '.env.development.local' });

import { getDatabaseConfig } from './database.config';

const configService = new ConfigService();
console.log(configService); // Periksa apakah ConfigService sekarang berisi data

const dataSourceOptions = getDatabaseConfig(configService);
console.log(dataSourceOptions); // Periksa dataSourceOptions setelah diambil dari ConfigService

// @ts-expect-error  ignore this line of error
export default new DataSource(dataSourceOptions);
