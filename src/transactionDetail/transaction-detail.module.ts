import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionDetail } from './transaction-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionDetail])],
  providers: [],
  exports: [],
})
export class TransactionDetailModule {}
