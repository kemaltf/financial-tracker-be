import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { CreateProductVariantDto } from './create-product-variant.dto';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @IsNumber()
  @IsNotEmpty()
  price: number; // ⬅️ Ganti dari @IsDecimal() ke @IsNumber()

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  categories: number[]; // Array of category IDs

  @IsNumber()
  @IsNotEmpty()
  storeId: number; // Store ID

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[]; // Optional, array of image IDs

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];
}
