import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { Account } from 'src/account/account.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounting_entries')
export class AccountingEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.entries, {
    onDelete: 'CASCADE',
  })
  transaction: Transaction;

  @ManyToOne(() => Account, (account) => account.entries, {
    onDelete: 'RESTRICT',
  })
  account: Account;

  @Column({
    type: 'enum',
    enum: ['DEBIT', 'CREDIT'],
  })
  entry_type: 'DEBIT' | 'CREDIT';

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'timestamp' })
  entry_date: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
