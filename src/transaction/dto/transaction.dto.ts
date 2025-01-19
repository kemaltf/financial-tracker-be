import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsDate,
} from 'class-validator';

export class TransactionDTO {
  @IsNumber()
  @IsNotEmpty()
  transactionTypeId: number;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsNotEmpty()
  @IsNumber()
  debitAccountId: number;

  @IsNotEmpty()
  @IsNumber()
  creditAccountId: number;

  @IsNumber()
  @IsOptional()
  customerId?: number;

  @IsNumber()
  @IsOptional()
  storeId?: number;

  @IsOptional()
  @IsDate() // Memvalidasi bahwa string tersebut memiliki format ISO8601
  @Type(() => Date) // Mengonversi string menjadi objek Date
  dueDate?: Date; // Menerima string sebagai dueDate

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
