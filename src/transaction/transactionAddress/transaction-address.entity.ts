import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('transaction_address')
export class TransactionAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, (transaction) => transaction.address)
  @JoinColumn() // Menambahkan JoinColumn untuk relasi OneToOne
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
