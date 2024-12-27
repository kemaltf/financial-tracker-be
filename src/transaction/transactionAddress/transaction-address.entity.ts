import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transaction_addresses')
export class TransactionAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.address)
  transaction: Transaction;

  @Column('varchar', { length: 255 })
  recipientName: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
