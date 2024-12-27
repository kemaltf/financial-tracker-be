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

  @IsArray()
  @IsOptional()
  details?: {
    // Assuming transaction details have a name and value, but adjust based on your structure
    name: string;
    value: number;
  }[];

  @IsOptional()
  logInfo?: {
    details: string;
    performedBy: string;
    debitAccountId: number;
    creditAccountId: number;
  };
}
