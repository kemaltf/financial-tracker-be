import { IsOptional, IsString } from 'class-validator';

export class CreateCitiesDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  provinceId?: string;
}
