import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WalletType } from '../wallet.entity';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  wallet_name: string; // Nama wallet/rekening (misalnya Mandiri A, Mandiri B)

  @IsOptional()
  @IsEnum(WalletType)
  wallet_type: 'Cash' | 'Bank' | 'PayPal' | 'Other';

  @IsOptional()
  @IsString()
  bank_name?: string; // Nama bank, jika wallet jenis Bank

  @IsOptional()
  @IsString()
  account_number?: string; // Nomor rekening (jika jenis wallet Bank)
}
