import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { Product } from '@app/product/entity/product.entity';
import { Store } from '@app/store/store.entity';
import { TransactionOrder } from '@app/transaction/transaction-order/transaction-order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  OneToMany,
  ManyToOne,
} from 'typeorm';

// EVENT DISCOUNT ITU PER PRODUCT
@Entity('product_discount')
export class ProductDiscount {
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
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  discountValue: number; // Nilai diskon (contoh: 15% atau Rp20.000)

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
    nullable: true,
  })
  maxDiscount: number; // Maksimal potongan diskon (jika ada)

  @Column('timestamp')
  startDate: Date;

  @Column('timestamp')
  endDate: Date;

  // Many-to-Many dengan Produk untuk tau produk apa aja yang masuk ke dalam diskon
  @ManyToMany(() => Product, (product) => product.productDiscounts)
  @JoinTable({
    name: 'product_discount_product', // Nama tabel pivot
    joinColumn: {
      name: 'product_discount_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @OneToMany(
    () => TransactionOrder,
    (transaction) => transaction.productDiscount,
  )
  transactions: TransactionOrder[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Status promo (aktif/tidak)

  @ManyToOne(() => Store, (store) => store.productDiscount, { nullable: false })
  store: Store;
}
