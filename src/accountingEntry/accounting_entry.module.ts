import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingEntry } from './accounting_entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingEntry])],
  providers: [],
  exports: [],
})
export class AccountingEntryModule {}
