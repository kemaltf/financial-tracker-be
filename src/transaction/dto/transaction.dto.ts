import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  IsDate,
  IsPostalCode,
  IsPhoneNumber,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddressDTO {
  @IsString()
  recipientName: string;

  @IsString()
  addressLine1: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsPostalCode('any')
  postalCode: string;

  @IsPhoneNumber() // Menggunakan format telepon global
  phoneNumber: string;
}

export class OrderDTO {
  @IsInt()
  @Min(1)
  productId: number; // ID produk, harus integer dan minimal 1

  @IsInt()
  @Min(1)
  quantity: number; // Jumlah produk, harus integer dan minimal 1
}

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
  debtorId?: number;

  @IsNumber()
  @IsOptional()
  creditorId?: number;

  @IsNumber()
  @IsOptional()
  storeId?: number;

  @IsOptional()
  @IsDate() // Memvalidasi bahwa string tersebut memiliki format ISO8601
  @Type(() => Date) // Mengonversi string menjadi objek Date
  dueDate?: Date; // Menerima string sebagai dueDate

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDTO)
  address?: AddressDTO;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderDTO)
  orders?: OrderDTO[];
}
