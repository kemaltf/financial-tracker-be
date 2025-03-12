import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionOrder } from './transaction-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionOrder])],
  providers: [],
  exports: [],
})
export class TransactionProductModule {}
