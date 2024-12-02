import { DataSource } from 'typeorm';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'user',
        password: 'password',
        database: 'test',
        // connectTimeout: 60 * 60 * 1000,
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true, // Jangan aktifkan di production!
      });

      return dataSource.initialize();
    },
  },
];
