import { Transaction } from 'src/transaction/transaction.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.wallets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['Cash', 'Bank', 'PayPal', 'Other'], // Sesuai dengan jenis wallet
    default: 'Cash',
  })
  wallet_type: 'Cash' | 'Bank' | 'PayPal' | 'Other';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  balance: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
