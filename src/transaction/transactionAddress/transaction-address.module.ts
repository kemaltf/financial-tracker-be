import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionAddress } from './transaction-address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionAddress])],
  providers: [],
  exports: [],
})
export class TransactionAddressModule {}
