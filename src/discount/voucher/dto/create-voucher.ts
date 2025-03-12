import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateVoucherDto {
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

  // 🆕 Wajib diisi hanya jika applyTo = 'PRODUCT'
  @ValidateIf((o) => o.applyTo === 'PRODUCT')
  @IsArray()
  @IsNotEmpty({ each: true })
  productIds?: number[];

  @IsNumber()
  storeId: number;
}

export class UpdateVoucherDto extends CreateVoucherDto {}
