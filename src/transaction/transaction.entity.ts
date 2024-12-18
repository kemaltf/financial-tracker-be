import { Account } from 'src/account/account.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Account, { eager: true })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: number; // ID akun yang terkait dengan transaksi

  @Column('decimal')
  amount: number; // Jumlah transaksi (positif untuk deposit, negatif untuk penarikan)

  @Column()
  type: string; // Jenis transaksi (deposit, withdrawal, transfer)

  @CreateDateColumn()
  createdAt: Date;
}
