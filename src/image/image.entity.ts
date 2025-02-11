import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductVariant } from 'src/product/entity/product-variant.entity';
import { Product } from 'src/product/entity/product.entity';
import { User } from '@app/user/user.entity';

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

  @ManyToMany(() => Product, (product) => product.images)
  @JoinTable({
    name: 'product_images',
    joinColumn: { name: 'image_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @ManyToMany(() => ProductVariant, (variant) => variant.images)
  @JoinTable({
    name: 'product_variant_images',
    joinColumn: { name: 'image_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'product_variant_id',
      referencedColumnName: 'id',
    },
  })
  productVariants: ProductVariant[];

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(
    () => User,
    (user) => user.images,
    { onDelete: 'CASCADE' }, // Menambahkan cascade delete
  )
  @JoinColumn({ name: 'user_id' }) // Menentukan nama kolom di DB
  user: User;
}
