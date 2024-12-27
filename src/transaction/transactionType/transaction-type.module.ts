import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionType } from './transaction-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionType])],
  providers: [],
  exports: [],
})
export class TransactionTypeModule {}
