import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateProductDiscountDto {
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  discountType: 'PERCENTAGE' | 'FIXED';

  @IsNumber()
  @IsOptional()
  discountValue?: number;

  @IsNumber()
  @IsOptional()
  maxDiscount?: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  productIds: number[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  storeId: number;
}

export class UpdateProductDiscountDto extends CreateProductDiscountDto {}
