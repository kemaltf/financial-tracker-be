import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';

export class CreatePromoDto {
  @IsString()
  code: string;

  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsEnum(['PERCENTAGE', 'FIXED'])
  discountType: 'PERCENTAGE' | 'FIXED';

  @IsEnum(['PRODUCT', 'TOTAL'])
  applyTo: 'PRODUCT' | 'TOTAL';

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
}

export class UpdatePromoDto extends CreatePromoDto {}
