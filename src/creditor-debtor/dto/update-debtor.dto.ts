import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDebtorDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactInfo?: string;
}
