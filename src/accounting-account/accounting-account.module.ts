import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingAccount } from './accounting-account.entity';
import { AccountingAccountService } from './accounting-account.service';
import { AccountingAccountController } from './accounting-account.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingAccount])],
  providers: [AccountingAccountService],
  controllers: [AccountingAccountController],
  exports: [AccountingAccountService, TypeOrmModule],
})
export class AccountingAccountModule {}
