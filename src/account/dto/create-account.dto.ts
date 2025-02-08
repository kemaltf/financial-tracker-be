import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { AccountType } from '../account.entity';

export class CreateAccountDTO {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string; // Nama akun

  @IsEnum(AccountType, { message: 'Invalid account type' })
  @IsNotEmpty({ message: 'Type is required' })
  type: AccountType; // Jenis akun (enum)

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string; // Deskripsi opsional
}
