import { AccountType } from 'src/account-types/account-type.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @ManyToOne(() => AccountType, (accountType) => accountType.id)
  @JoinColumn({ name: 'typeId' })
  accountType: AccountType; // Relasi dengan AccountType

  @Column()
  typeId: number; // Foreign Key untuk relasi ke AccountType
}
