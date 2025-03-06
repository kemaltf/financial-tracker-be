import { Entity, ManyToOne, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Product } from './product.entity';
import { Image } from '@app/image/image.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, (product) => product.productImages, {
    onDelete: 'CASCADE',
  })
  product: Product;

  @ManyToOne(() => Image, (image) => image.productImages, {
    onDelete: 'CASCADE',
  })
  image: Image;

  @Column({ type: 'int' }) // Tambahkan kolom urutan
  order: number;
}
