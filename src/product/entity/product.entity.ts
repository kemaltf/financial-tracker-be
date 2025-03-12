import { Category } from 'src/category/category.entity';
import { Store } from 'src/store/store.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { ProductImage } from './product-images.entity';
import { EventDiscount } from '@app/discount/event-discount.entity';

// e.g *jika huruf mtO onya besar berarti disimpan idnya di tabel ini
// name    | sku     | desc                 | stock | price  | categories (mtm)| store (mtO) | variants (otM)  | images (mtm)|
// 'Jacket'| 'JKT001'| 'Jacket musim dingin'|  50   | 250.0, | [1,2]           | 1           | [1,2,3,4]       | [1,2,3]     |

@Entity('products')
@Unique(['sku', 'store']) // Menambahkan constraint unik pada sku
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  stock: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price: number;

  // ✅ Kolom Baru: Dimensi dan Berat Produk
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  length: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  width: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: new ColumnNumericTransformer(),
  })
  height: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  weight: number;

  @ManyToMany(() => Category, (category) => category.products, {
    cascade: false, // Hindari cascade agar Image tidak ikut terhapus
    onDelete: 'CASCADE', // Hanya hapus dari tabel pivot
  })
  categories: Category[];

  @ManyToOne(() => Store, (store) => store.products)
  store: Store;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: ['remove'],
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
  })
  productImages: ProductImage[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => EventDiscount, (eventDiscount) => eventDiscount.products)
  eventDiscounts: EventDiscount[];
}
