import { IsOptional, IsString } from 'class-validator';

export class CreateProvincesDto {
  @IsOptional()
  @IsString()
  id?: string;
}
