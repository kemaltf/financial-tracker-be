import { IsOptional, IsString } from 'class-validator';

export class CreateCountryDto {
  @IsOptional()
  @IsString()
  id?: string;
}
