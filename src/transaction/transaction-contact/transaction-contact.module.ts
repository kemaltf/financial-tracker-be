import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionContact } from './transaction-contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionContact])],
  providers: [],
  exports: [],
})
export class TransactionContactModule {}
