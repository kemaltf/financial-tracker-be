import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionType } from './transactionType/transaction-type.entity';
import { SubAccount } from '@app/account/sub-account.entity';
import { TransactionContact } from './transaction-contact/transaction-contact.entity';
import { TransactionProduct } from './transactionDetail/transaction-detail.entity';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import { Customer } from '@app/customer/entity/customer.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import { DebtorCreditor } from '@app/creditor-debtor/creditor-debtor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      TransactionType,
      SubAccount,
      TransactionContact,
      TransactionProduct,
      Product,
      Store,
      Customer,
      DebtsAndReceivables,
      DebtorCreditor,
    ]),
  ],
  providers: [TransactionService],
  controllers: [TransactionController],
})
export class TransactionModule {}
