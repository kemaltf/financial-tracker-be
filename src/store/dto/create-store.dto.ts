import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsPostalCode,
  IsPhoneNumber,
} from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  subdistrict: string;

  @IsNotEmpty()
  @IsPostalCode('any')
  postalCode: string;

  @IsNotEmpty()
  @IsPhoneNumber() // Menggunakan format telepon global
  phoneNumber: string;
}
