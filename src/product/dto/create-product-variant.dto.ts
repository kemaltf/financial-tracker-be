import {
  IsString,
  IsNumber,
  IsDecimal,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsInt()
  @IsNotEmpty()
  variantTypeId: number; // ID of the variant type

  @IsString()
  @IsNotEmpty()
  variant_value: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  stock: number;

  // Properti lainnya
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imageIds?: number[]; // Optional, array of image IDs
}
