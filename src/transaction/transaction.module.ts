import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { AccountingEntry } from '@app/accountingEntry/accounting_entry.entity';
import { TransactionType } from './transactionType/transaction-type.entity';
import { Wallet } from '@app/wallet/wallet.entity';
import { Account } from '@app/account/account.entity';
import { TransactionAddress } from './transactionAddress/transaction-address.entity';
import { TransactionDetail } from './transactionDetail/transaction-detail.entity';
import { Product } from '@app/product/entity/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      Transaction,
      TransactionType,
      Account,
      AccountingEntry,
      TransactionAddress,
      TransactionDetail,
      Product,
    ]),
  ],
  providers: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
