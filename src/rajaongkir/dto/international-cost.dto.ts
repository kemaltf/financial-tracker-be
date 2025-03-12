import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CourierType } from '../types';

export class InternationalCostDto {
  @IsString()
  origin: string;

  @IsString()
  destination: string;

  @IsNumber()
  weight: number;

  @IsEnum(CourierType)
  courier: CourierType;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsNumber()
  width?: number;
}
