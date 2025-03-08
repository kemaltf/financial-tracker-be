import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
  ManyToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';
import { ProductVariantOptions } from './product-variant-option.entity';
import { Store } from '@app/store/store.entity';
import { Image } from '@app/image/image.entity';

// e.g
// product (mtO) | sku              | price | stock | options
// 1             | 'TS001-S-Merah'  | 2     | 1     | [1,2,3]
@Entity('product_variants')
@Unique(['sku', 'store'])
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  sku: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  price: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: new ColumnNumericTransformer(),
  })
  weight: number;

  // di cascade dulu bagian yang mau di delete on cascadenya
  @OneToMany(
    () => ProductVariantOptions,
    (productVariantOptions) => productVariantOptions.productVariant,
    { cascade: true },
  )
  options: ProductVariantOptions[];

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => Store, (store) => store.productVariants)
  store: Store;

  @ManyToMany(() => Image, (image) => image.productVariants, {
    cascade: false, // Hindari cascade agar Image tidak ikut terhapus
    onDelete: 'CASCADE', // Hanya hapus dari tabel pivot
  })
  images: Image[];
}
