import { TransactionAddress } from 'src/transactionAddress/transaction-address.entity';
import { TransactionDetail } from 'src/transactionDetail/transaction-detail.entity';
import { TransactionType } from 'src/transactionType/transaction-type.entity';
import { User } from 'src/user/user.entity';
import { Wallet } from 'src/wallet/wallet.entity';
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

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.Transactions)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(
    () => TransactionType,
    (transactionType) => transactionType.transactions,
  )
  @JoinColumn({ name: 'transaction_type_id' })
  transactionType: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'int' })
  wallet_id: number;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @OneToMany(
    () => TransactionDetail,
    (transactionDetail) => transactionDetail.transaction,
  )
  details: TransactionDetail[];

  @OneToMany(
    () => TransactionAddress,
    (transactionAddress) => transactionAddress.transaction,
  )
  address: TransactionAddress[];
}
