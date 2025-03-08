import { IsOptional, IsString } from 'class-validator';

export class CreateSubdistrictsDto {
  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  id?: string;
}
