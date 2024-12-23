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
import { Transaction } from 'src/transaction/transaction.entity';
import { User } from 'src/user/user.entity';

export enum WalletType {
  CASH = 'Cash',
  BANK = 'Bank',
  PAYPAL = 'PayPal',
  OTHER = 'Other',
}

@Entity('wallet')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number; //

  @ManyToOne(() => User, (user) => user.wallets)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: WalletType,
    default: 'Cash',
  })
  wallet_type: 'Cash' | 'Bank' | 'PayPal' | 'Other';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  balance: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  wallet_name: string; // Nama wallet/rekening (misalnya Mandiri A, Mandiri B)

  @Column({ type: 'varchar', length: 255, nullable: true })
  bank_name: string; // Nama bank, jika wallet jenis Bank

  @Column({ type: 'varchar', length: 255, nullable: true })
  account_number: string; // Kolom baru untuk nomor rekening

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];
}
