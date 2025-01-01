import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
} from 'class-validator';

export class TransactionDTO {
  @IsNumber()
  @IsNotEmpty()
  walletId: number;

  @IsNumber()
  @IsNotEmpty()
  transactionTypeId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  storeId?: number;

  @IsOptional()
  address?: {
    recipientName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phoneNumber: string;
  };

  // Details hanya berisi ID produk dan kuantitas
  @IsArray()
  @IsOptional()
  details?: {
    productId: number; // ID produk
    quantity: number; // Jumlah produk
  }[];
}
