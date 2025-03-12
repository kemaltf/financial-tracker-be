import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { CourierType, DestinationType, OriginType } from '../types';

export class ShippingCostDto {
  @IsString()
  origin: string;

  @IsEnum(OriginType)
  originType: OriginType;

  @IsString()
  destination: string;

  @IsEnum(DestinationType)
  destinationType: DestinationType;

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
