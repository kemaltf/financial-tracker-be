import { IsString } from 'class-validator';

export class WaybillDto {
  @IsString()
  waybill: string;

  @IsString()
  courier: string;
}
