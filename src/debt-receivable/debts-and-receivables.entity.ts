import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transaction } from '@app/transaction/transaction.entity';
import { FinancialParty } from '@app/financial-party/entity/financial-party.entity';

@Entity('debts_and_receivables')
export class DebtsAndReceivables {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FinancialParty, (debtor) => debtor.debtor, {
    nullable: true,
  })
  @JoinColumn({ name: 'debtor_id' })
  debtor: FinancialParty;

  @ManyToOne(() => FinancialParty, (creditor) => creditor.creditor, {
    nullable: true,
  })
  @JoinColumn({ name: 'creditor_id' })
  creditor: FinancialParty;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'enum', enum: ['pending', 'paid'], default: 'pending' })
  status: 'pending' | 'paid';

  @ManyToOne(
    () => Transaction,
    (transaction) => transaction.debtsAndReceivables,
  )
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;
}
