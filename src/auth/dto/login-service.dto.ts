// src/seller/dto/login-seller.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Username of the seller',
    example: 'seller123',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Password of the seller',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
