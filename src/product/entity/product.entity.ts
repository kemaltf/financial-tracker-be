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
} from 'typeorm';
import { Image } from 'src/image/image.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
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

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;

  @ManyToMany(() => Category, (category) => category.products)
  categories: Category[];

  @ManyToOne(() => Store, (store) => store.products)
  store: Store;

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => Image, (image) => image.product)
  images: Image[];
}
