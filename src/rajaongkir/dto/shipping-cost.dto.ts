import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { CourierType, DestinationType, OriginType } from '../types';

export class CourierListDto {
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

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(CourierType, { each: true })
  courier: CourierType[];

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

export class SelectedShippingCostDto extends CourierListDto {
  @IsString()
  service: string;
}
