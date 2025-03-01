import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsArray()
  @IsInt({ each: true })
  @IsNotEmpty()
  variantTypeIds: number[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  variantValues: string[];

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
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[];
}
