import { SeederManager } from './seeders';
import AppDataSource from './orm.config';

AppDataSource.initialize()
  .then(async () => {
    await SeederManager.run(AppDataSource);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Gagal menjalankan seeder:', error);
    process.exit(1);
  });
