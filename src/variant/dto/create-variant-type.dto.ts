import { IsNumber, IsString, Length } from 'class-validator';

export class CreateVariantTypeDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsNumber()
  storeId: number;
}
