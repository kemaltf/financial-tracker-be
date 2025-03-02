import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsInt,
  ValidateNested,
  ValidateIf,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateProductVariantDto {
  @IsOptional()
  @IsInt()
  id?: number; // ID varian (hanya untuk varian yang sudah ada)

  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  variantOptions: Record<string, string>;

  @IsOptional()
  @IsString()
  sku?: string; // SKU varian

  @IsOptional()
  @IsNumber()
  price?: number; // Harga varian

  @IsOptional()
  @IsNumber()
  stock?: number; // Stok varian

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string; // Nama produk

  @IsOptional()
  @IsString()
  sku?: string; // SKU produk

  @IsOptional()
  @IsString()
  description?: string; // Deskripsi produk

  @IsOptional()
  @IsNumber()
  price?: number; // Harga produk

  @IsOptional()
  @IsNumber()
  stock?: number; // Stok produk

  // @IsOptional()
  // @IsInt()
  // storeId?: number; // ID store yang terkait

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categories?: number[]; // ID kategori

  @IsOptional()
  @ValidateIf(
    (_, value) =>
      value === null ||
      (Array.isArray(value) && value.every((v) => typeof v === 'number')),
  )
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[]; // Varian produk
}
