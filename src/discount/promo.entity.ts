import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Transaction } from 'src/transaction/transaction.entity';

// PROMO ADALAH DISKON TIPE KODE KUPON
@Entity('promo')
export class Promo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // Kode kupon

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED'],
    default: 'PERCENTAGE',
  })
  discountType: 'PERCENTAGE' | 'FIXED'; // Diskon dalam persen atau nominal

  @Column({
    type: 'enum',
    enum: ['PRODUCT', 'TOTAL'],
    default: 'TOTAL',
  })
  applyTo: 'PRODUCT' | 'TOTAL'; // Diskon per produk atau total transaksi

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  discountValue: number; // Nilai diskon (contoh: 10% atau Rp50.000)

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxDiscount: number; // Maksimal potongan diskon (jika ada)

  @Column('timestamp')
  startDate: Date;

  @Column('timestamp')
  endDate: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.promo)
  transactions: Transaction[];
}
