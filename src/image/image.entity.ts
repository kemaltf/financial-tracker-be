import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ProductVariant } from 'src/product/entity/product-variant.entity';
import { Product } from 'src/product/entity/product.entity';

@Entity('images')
export class Image {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  key: string; // Key di S3

  @Column({ type: 'varchar', length: 255 })
  url: string; // URL publik dari file

  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType: string; // Tipe MIME file

  @Column({ type: 'bigint' })
  size: number; // Ukuran file dalam byte

  @ManyToOne(() => Product, (product) => product.images, { nullable: true })
  product: Product;

  @ManyToOne(() => ProductVariant, (variant) => variant.images, {
    nullable: true,
  })
  productVariant: ProductVariant;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updated_at: Date;
}
