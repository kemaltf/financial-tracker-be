import { Store } from '@app/store/store.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

@Entity('courier')
export class Courier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Kode kurir (contoh: "jne", "pos", "tiki")

  @Column()
  courierCode: string; // Kode kurir (contoh: "jne", "pos", "tiki")

  @Column('simple-array') // Menyimpan layanan dalam bentuk array
  allowedServices: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Store, (store) => store.couriers, {
    onDelete: 'CASCADE',
  })
  store: Store; // Relasi ke Store
}
