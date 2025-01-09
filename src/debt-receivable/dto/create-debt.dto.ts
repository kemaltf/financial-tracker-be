import { IsEnum, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateDebtDto {
  @IsNumber()
  userId: number;

  @IsOptional()
  @IsNumber()
  transactionId?: number;

  @IsNumber()
  amount: number;

  @IsEnum(['debt', 'receivable'])
  type: 'debt' | 'receivable';

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(['pending', 'paid'])
  status?: 'pending' | 'paid';
}
