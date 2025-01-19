import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('debtors-creditor')
export class DebtorCreditor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  addressLine1: string;

  @Column('varchar', { length: 255, nullable: true })
  addressLine2: string;

  @Column('varchar', { length: 100 })
  city: string;

  @Column('varchar', { length: 100 })
  state: string;

  @Column('varchar', { length: 20 })
  postalCode: string;

  @Column('varchar', { length: 20 })
  phoneNumber: string;

  @Column({ type: 'enum', enum: ['debtor', 'creditor'] })
  role: 'debtor' | 'creditor';

  @OneToMany(
    () => DebtsAndReceivables,
    (debtsAndReceivables) => debtsAndReceivables.financial_party,
  )
  debtsAndReceivables: DebtsAndReceivables[];

  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
