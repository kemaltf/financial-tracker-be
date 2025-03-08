import { Product } from '@app/product/entity/product.entity';
import { TransactionOrder } from '@app/transaction/transaction-order/transaction-order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';

// EVENT DISCOUNT ITU PER PRODUCT
@Entity('event_discount')
export class EventDiscount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventName: string; // Nama event diskon (contoh: "Diskon Lebaran")

  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED'],
    default: 'PERCENTAGE',
  })
  discountType: 'PERCENTAGE' | 'FIXED'; // Diskon dalam persen atau nominal

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  discountValue: number; // Nilai diskon (contoh: 15% atau Rp20.000)

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

  // Many-to-Many dengan Produk untuk tau produk apa aja yang masuk ke dalam diskon
  @ManyToMany(() => Product, (product) => product.eventDiscounts)
  @JoinTable({
    name: 'event_discount_product', // Nama tabel pivot
    joinColumn: { name: 'event_discount_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @OneToMany(() => TransactionOrder, (transaction) => transaction.eventDiscount)
  transactions: TransactionOrder[];
}
