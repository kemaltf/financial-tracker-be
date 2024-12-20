import { DataSource } from 'typeorm';
import { SeederManager } from './seeders';
import { TransactionType } from 'src/transactionType/transaction-type.entity';
import { Account } from 'src/account/account.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import { AccountingEntry } from 'src/accountingEntry/accounting_entry.entity';
import { User } from 'src/user/user.entity';
import { Wallet } from 'src/wallet/wallet.entity';
import { TransactionDetail } from 'src/transactionDetail/transaction-detail.entity';
import { Category } from 'src/category/category.entity';
import { Store } from 'src/store/store.entity';
import { TransactionLog } from 'src/transactionLogs/transaction-log.entity';
import { TransactionAddress } from 'src/transactionAddress/transaction-address.entity';
import { Product } from 'src/product/entity/product.entity';

const AppDataSource = new DataSource({
  type: 'mysql', // or your DB type
  host: 'localhost', // your DB host
  port: 3306, // your DB port
  username: 'user', // your DB username
  password: 'password', // your DB password
  database: 'test', // your DB name
  entities: [
    TransactionType,
    Transaction,
    Account,
    AccountingEntry,
    User,
    Wallet,
    Transaction,
    TransactionDetail,
    Product,
    Category,
    Store,
    TransactionLog,
    TransactionAddress,
  ],
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
