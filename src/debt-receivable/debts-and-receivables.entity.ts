import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from '@app/transaction/transaction.entity';
import { DebtorCreditor } from '@app/creditor-debtor/creditor-debtor.entity';

@Entity('debts_and_receivables')
export class DebtsAndReceivables {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Transaction,
    (transaction) => transaction.debtsAndReceivables,
    { nullable: true },
  )
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['debt', 'receivable'] })
  type: 'debt' | 'receivable';

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'enum', enum: ['pending', 'paid'], default: 'pending' })
  status: 'pending' | 'paid';

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;

  @ManyToOne(() => DebtorCreditor, (debtor) => debtor.debtsAndReceivables, {
    nullable: true,
  })
  @JoinColumn({ name: 'debtor_id' })
  financial_party: DebtorCreditor;
}
