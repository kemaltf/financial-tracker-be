import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionType } from './transactionType/transaction-type.entity';
import { SubAccount } from '@app/account/sub-account.entity';
import { TransactionContact } from './transaction-contact/transaction-contact.entity';
import { TransactionOrder } from './transactionProduct/transaction-product.entity';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import { FinancialParty } from '@app/financial-party/entity/financial-party.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      TransactionType,
      SubAccount,
      TransactionContact,
      TransactionOrder,
      Product,
      Store,
      FinancialParty,
      DebtsAndReceivables,
    ]),
  ],
  providers: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
