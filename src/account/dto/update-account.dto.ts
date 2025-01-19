import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateAccountDTO {
  @IsString()
  @IsOptional()
  @MaxLength(20, { message: 'Code must not exceed 20 characters' })
  code?: string; // Kode akun opsional

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string; // Nama akun opsional

  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'Description must not exceed 255 characters' })
  description?: string; // Deskripsi opsional
}
