import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from '@app/transaction/transaction.entity';
import { DebtorCreditor } from '@app/creditor-debtor/creditor-debtor.entity';

@Entity('debts_and_receivables')
export class DebtsAndReceivables {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DebtorCreditor, (debtor) => debtor.debtsAndReceivables, {
    nullable: true,
  })
  @JoinColumn({ name: 'debtor_id' })
  financial_party: DebtorCreditor;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'enum', enum: ['pending', 'paid'], default: 'pending' })
  status: 'pending' | 'paid';

  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
