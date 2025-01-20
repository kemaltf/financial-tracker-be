import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

@Entity('transaction_contact')
export class TransactionContact {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Transaction, (transaction) => transaction.transactionContact)
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
}
