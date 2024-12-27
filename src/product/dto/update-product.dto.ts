import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsUUID,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class UpdateProductVariantDto {
  @IsOptional()
  @IsInt()
  id?: number; // ID varian (hanya untuk varian yang sudah ada)

  @IsOptional()
  @IsUUID()
  variantTypeId?: number; // ID tipe varian

  @IsOptional()
  @IsString()
  variant_value?: string; // Nilai varian

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
  @IsUUID('4', { each: true })
  imageIds?: string[]; // ID gambar varian
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

  @IsOptional()
  @IsInt()
  store?: number; // ID store yang terkait

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categories?: number[]; // ID kategori

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  imageIds?: string[]; // ID gambar utama produk

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[]; // Varian produk
}
