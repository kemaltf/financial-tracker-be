import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionLog } from './transaction-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionLog])],
  providers: [],
  exports: [],
})
export class TransactionLogModule {}
