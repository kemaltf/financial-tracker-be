import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsObject,
  ValidateNested,
  ValidateIf,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  @IsNotEmpty()
  variantOptions: Record<string, string>;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @IsOptional()
  @ValidateIf(
    (_, value) =>
      value === null ||
      (Array.isArray(value) && value.every((v) => typeof v === 'number')),
  )
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[] | null;
}
