import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  storeId?: number; // ID Toko jika ingin diperbarui

  @IsOptional()
  @IsNumber({}, { each: true })
  categoryIds?: number[]; // ID Kategori jika ingin diperbarui
}
