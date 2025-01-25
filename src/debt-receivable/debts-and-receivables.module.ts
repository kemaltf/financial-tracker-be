import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DebtsAndReceivablesService } from './debts-and-receivables.service';
import { DebtsAndReceivables } from './debts-and-receivables.entity';
import { DebtsAndReceivablesController } from './debts-and-receivables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DebtsAndReceivables])],
  controllers: [DebtsAndReceivablesController],
  providers: [DebtsAndReceivablesService],
})
export class DebtsAndReceivablesModule {}
