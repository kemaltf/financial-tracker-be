import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Transaction } from 'src/transaction/transaction.entity';
import { DebtsAndReceivables } from '@app/debt-receivable/debts-and-receivables.entity';

export enum Role {
  debtor = 'DEBTOR',
  creditor = 'CREDITOR',
  customer = 'CUSTOMER',
}

@Entity('financial_party')
export class FinancialParty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('varchar', { length: 20, nullable: true })
  phone: string;

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

  @Column({ type: 'enum', enum: Role })
  role: Role;

  @OneToMany(() => Transaction, (transaction) => transaction.customer)
  transactions: Transaction[];

  @OneToMany(
    () => DebtsAndReceivables,
    (debtsAndReceivables) => debtsAndReceivables.debtor,
  )
  debtor: DebtsAndReceivables[];

  @OneToMany(
    () => DebtsAndReceivables,
    (debtsAndReceivables) => debtsAndReceivables.creditor,
  )
  creditor: DebtsAndReceivables[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
