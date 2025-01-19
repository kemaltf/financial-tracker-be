import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionProduct } from './transaction-product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionProduct])],
  providers: [],
  exports: [],
})
export class TransactionProductModule {}
