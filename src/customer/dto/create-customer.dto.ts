import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  Length,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  addressLine1: string;

  @IsString()
  @IsOptional()
  @Length(1, 255)
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  postalCode: string;
}
