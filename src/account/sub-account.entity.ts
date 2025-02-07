import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Account } from './account.entity';
import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { User } from '@app/user/user.entity';

@Entity('sub_accounts')
@Unique(['user', 'code']) // Membuat kombinasi user dan code unik
export class SubAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  code: string; // Kode akun, misalnya "101", "201", dll.

  @Column({ type: 'varchar', length: 100 })
  name: string; // Nama akun, misalnya "Kas", "Pendapatan", "Biaya Operasional"

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'account_id' })
  Account: Account; // Mengacu pada AccountType

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // Deskripsi opsional

  // Kolom untuk menyimpan saldo akun
  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  balance: number; // Saldo akun

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.Stores) // Wajib ada user_id
  @JoinColumn({ name: 'user_id' }) // Nama kolom di database
  user: User; // Relasi wajib dengan User
}
