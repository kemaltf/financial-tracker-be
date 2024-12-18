import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountSeeder } from './account/account.seeder';
import { Account } from './account/account.entity';
import { SeederService } from './seeder.manager';
import { AccountingAccount } from './accounting-account/accounting-account.entity';
import { AccountTypeModule } from './account-types/account-type.module';
import { AccountType } from './account-types/account-type.entity';
import { AccountTypeSeeder } from './account-types/account-type.seeder';
import { AccountModule } from './account/account.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql', // or your DB type
      host: 'localhost', // your DB host
      port: 3306, // your DB port
      username: 'user', // your DB username
      password: 'password', // your DB password
      database: 'test', // your DB name
      entities: [Account, AccountingAccount, AccountType], // Add all your entities here
      synchronize: true, // set to false in production for safety
    }),
    TypeOrmModule.forFeature([Account, AccountingAccount, AccountType]),
    AccountTypeModule,
    AccountModule,
  ], // Mengimpor TypeOrmModule
  providers: [AccountSeeder, AccountTypeSeeder, SeederService], // SeederManager sebagai provider
  exports: [SeederService],
})
export class SeederModule {}
