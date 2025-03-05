import { Store } from '@app/store/store.entity';
import { Product } from 'src/product/entity/product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
  Unique,
} from 'typeorm';

@Entity('categories')
@Unique(['store', 'name']) // Membuat kombinasi user dan code unik
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;

  @ManyToMany(() => Product, (product) => product.categories, {
    cascade: false,
    onDelete: 'RESTRICT', // Mencegah penghapusan jika masih ada relasi
  })
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'category_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @ManyToOne(() => Store, (store) => store.categories, { nullable: false })
  store: Store;
}
