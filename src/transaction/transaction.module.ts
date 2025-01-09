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
import { WalletLog } from '../wallet/walletLogs/wallet-log.entity';
import { Store } from '@app/store/store.entity';
import { Customer } from '@app/customer/entity/customer.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import { DebtorCreditor } from '@app/creditor-debtor/creditor-debtor.entity';

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
      WalletLog,
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
