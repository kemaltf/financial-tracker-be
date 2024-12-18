import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountSeeder } from './account.seeder';
import { AccountTypeModule } from 'src/account-types/account-type.module';
import { AccountingAccountModule } from 'src/accounting-account/accounting-account.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    AccountTypeModule, // Tambahkan module ini,
    AccountingAccountModule,
  ],
  providers: [AccountService, AccountSeeder],
  controllers: [AccountController],
  exports: [AccountSeeder],
})
export class AccountModule {}
