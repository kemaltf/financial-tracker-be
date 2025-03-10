import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { TransactionTypeModule } from './transaction/transactionType/transaction-type.module';
import { TransactionModule } from './transaction/transaction.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { TransactionProductModule } from './transaction/transaction-order/transaction-order.module';
import { TransactionContactModule } from './transaction/transaction-contact/transaction-contact.module';
import { StoreModule } from './store/store.module';
import { AccountModule } from './account/account.module';
import { VariantModule } from './variant/variant.module';
import { ImageModule } from './image/image.module';
import { AWSS3Module } from './aws/aws-s3.module';
import { CustomerModule } from './financial-party/financial-party.module';
import { DebtsAndReceivablesModule } from './debt-receivable/debts-and-receivables.module';
import { RajaOngkirModule } from './rajaongkir/raja-ongkir.module';
import { CourierModule } from './courier/courier.module';
import { VoucherModule } from './discount/voucher/voucher.module';

@Module({
  imports: [
    AWSS3Module,
    AccountModule,
    AuthModule,
    CategoryModule,
    DatabaseModule,
    ImageModule,
    ProductModule,
    StoreModule,
    TransactionContactModule,
    TransactionProductModule,
    TransactionModule,
    TransactionTypeModule,
    UserModule,
    VariantModule,
    CustomerModule,
    DebtsAndReceivablesModule,
    RajaOngkirModule,
    CourierModule,
    VoucherModule,
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
