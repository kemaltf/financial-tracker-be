import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { VariantType } from './variant-type.entity';
import { VariantOption } from '@app/product/entity/variant-option.entity';

@Entity()
@Unique(['name', 'variantType']) // Menjadikan kombinasi name + variantType unik
export class VariantName {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => VariantType, (variantType) => variantType.variantNames)
  variantType: VariantType;

  @OneToMany(() => VariantOption, (variantOption) => variantOption.variantName)
  variantOptions: VariantOption[];
}
