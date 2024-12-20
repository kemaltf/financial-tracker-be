import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber()
  stock: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  storeId: number; // ID Toko jika ada

  @IsOptional()
  @IsNumber({}, { each: true })
  categoryIds?: number[]; // ID Kategori jika ada
}
