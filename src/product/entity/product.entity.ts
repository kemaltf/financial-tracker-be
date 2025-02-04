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
import { Image } from 'src/image/image.entity';
import { ProductVariant } from './product-variant.entity';
import { ColumnNumericTransformer } from '@app/common/transformer/column-numeric.transformer';

@Entity('products')
@Unique(['sku']) // Menambahkan constraint unik pada sku
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

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Category, (category) => category.products)
  categories: Category[];

  @ManyToOne(() => Store, (store) => store.products)
  store: Store;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @ManyToMany(() => Image, (image) => image.products)
  images: Image[];
}
