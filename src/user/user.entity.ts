import { SubAccount } from '@app/account/sub-account.entity';
import { FinancialParty } from '@app/financial-party/entity/financial-party.entity';
import { Image } from '@app/image/image.entity';
import { Store } from '@app/store/store.entity';
import { Transaction } from 'src/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
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

  @OneToMany(() => Store, (store) => store.user)
  Stores: Store[];

  @OneToMany(() => FinancialParty, (financialParty) => financialParty.user)
  financialParties: FinancialParty[];

  @OneToMany(() => Image, (image) => image.user)
  images: Image[];

  @OneToMany(() => SubAccount, (transaction) => transaction.id)
  subAccount: SubAccount[];
}
