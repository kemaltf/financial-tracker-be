import { ProductVariantOptions } from '@app/product/entity/product-variant-option.entity';
import { VariantName } from '@app/variant/variant-name.entity';
import { Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';

// variant option ini untuk menghubungkan variant name dengan productnya
@Entity()
export class VariantOption {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VariantName, (variantName) => variantName.variantOptions)
  variantName: VariantName;

  @OneToMany(
    () => ProductVariantOptions,
    (productVariantOption) => productVariantOption.variantOption,
  )
  productVariantOptions: ProductVariantOptions[];
}
