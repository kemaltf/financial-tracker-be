import { IsString, IsOptional, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
