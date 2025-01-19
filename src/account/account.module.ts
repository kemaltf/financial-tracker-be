import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubAccount } from './sub-account.entity';
import { AccountController } from './sub-account.controller';
import { SubAccountService } from './sub-account.service';
import { Account } from './account.entity';
import { TransactionType } from '@app/transaction/transactionType/transaction-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SubAccount, Account, TransactionType])],
  providers: [SubAccountService],
  controllers: [AccountController],
})
export class AccountModule {}
