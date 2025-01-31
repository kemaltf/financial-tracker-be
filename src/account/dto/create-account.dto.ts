import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateAccountDTO {
  @IsString()
  @IsNotEmpty({ message: 'Code is required' })
  @MaxLength(20, { message: 'Code must not exceed 20 characters' })
  code: string; // Kode akun

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string; // Nama akun

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string; // Deskripsi opsional
}
