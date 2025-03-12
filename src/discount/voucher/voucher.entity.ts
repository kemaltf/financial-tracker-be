import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import { Transaction } from '@app/transaction/transaction.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';

// PROMO ADALAH DISKON TIPE KODE KUPON
@Entity('voucher')
export class Voucher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventName: string; // Nama event diskon (contoh: "Diskon Lebaran")

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

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Status promo (aktif/tidak)

  @OneToMany(() => Transaction, (transaction) => transaction.promo)
  transactions: Transaction[];

  // 🆕 Relasi ke produk untuk voucher yang berlaku pada produk tertentu
  @ManyToMany(() => Product, (product) => product.vouchers)
  @JoinTable({
    name: 'voucher_products',
    joinColumn: { name: 'voucherId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'productId', referencedColumnName: 'id' },
  })
  products: Product[];

  @ManyToOne(() => Store, (store) => store.vouchers, { nullable: false })
  store: Store;
}
