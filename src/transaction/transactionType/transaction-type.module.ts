import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionTypeService } from './transaction-type.service';
import { TransactionTypeController } from './transaction-type.controller';
import { TransactionType } from './transaction-type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionType])],
  providers: [TransactionTypeService],
  controllers: [TransactionTypeController],
})
export class TransactionTypeModule {}
