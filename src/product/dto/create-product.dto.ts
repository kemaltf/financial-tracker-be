import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
  ValidateNested,
  IsInt,
  ValidateIf,
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
  price: number;

  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  categories: number[]; // Array of category IDs

  @IsNumber()
  @IsNotEmpty()
  storeId: number; // Store ID

  @IsNumber()
  @IsOptional()
  length: number;

  @IsNumber()
  @IsOptional()
  width: number;

  @IsNumber()
  @IsOptional()
  height: number;

  @IsNumber()
  @IsNotEmpty()
  weight: number;

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
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[]; // Array of variants, each with its own combination of variant types and values
}
