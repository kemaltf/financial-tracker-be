import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtorCreditor } from './creditor-debtor.entity';
import { DebtorService } from './creditor-debtor.service';
import { DebtorController } from './creditor-debtor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DebtorCreditor])],
  controllers: [DebtorController],
  providers: [DebtorService],
  exports: [DebtorService],
})
export class DebtorModule {}
