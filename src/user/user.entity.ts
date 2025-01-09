import { WalletLog } from '@app/wallet/walletLogs/wallet-log.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import { Wallet } from 'src/wallet/wallet.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  AUDITOR = 'auditor',
  SUPPORT = 'support',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') // Menggunakan UUID sebagai tipe ID
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER, // Role default adalah USER
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  Transactions: Transaction[];

  @ManyToMany(() => Wallet, (wallet) => wallet.users)
  @JoinTable({
    name: 'user_wallet_access', // Nama tabel penghubung
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'wallet_id',
      referencedColumnName: 'id',
    },
  })
  wallets: Wallet[];

  @OneToMany(() => WalletLog, (log) => log.performed_by)
  transactionLogs: WalletLog[];
}
