import { Transform } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class UploadImageDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  storeId?: number;
}
