import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TransactionTypeModule } from './transactionType/transaction-type.module';
import { TransactionModule } from './transaction/transaction.module';
import { WalletModule } from './wallet/wallet.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { TransactionDetailModule } from './transactionDetail/transaction-detail.module';
import { TransactionAddressModule } from './transactionAddress/transaction-address.module';
import { StoreModule } from './store/store.module';
import { TransactionLogModule } from './transactionLogs/transaction-log.module';
import { AccountingEntryModule } from './accountingEntry/accounting_entry.module';
import { AccountModule } from './account/account.module';
import { VariantModule } from './variant/variant.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AuthModule,
    TransactionTypeModule,
    TransactionModule,
    WalletModule,
    ProductModule,
    CategoryModule,
    TransactionDetailModule,
    TransactionAddressModule,
    StoreModule,
    TransactionLogModule,
    AccountingEntryModule,
    AccountModule,
    VariantModule,
    ImageModule,
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
