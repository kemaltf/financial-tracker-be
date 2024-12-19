import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/user/user.entity';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post()
  async create(
    @Body() createWalletDto: CreateWalletDto,
    @GetUser() user: User,
  ) {
    return this.walletService.create(user.username, createWalletDto);
  }

  @Get()
  async findWallet(@Query('id') id: number, @GetUser() user: User) {
    if (id) {
      // Jika ada parameter 'id', cari wallet berdasarkan ID
      return this.walletService.findOne(id);
    } else if (user.username) {
      // Jika ada 'username', cari wallet berdasarkan username
      return this.walletService.findAllByUser(user.username);
    } else {
      throw new Error('Harap beri parameter id atau username');
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateWalletDto: UpdateWalletDto,
    @GetUser() user: User,
  ) {
    return this.walletService.update(user.username, id, updateWalletDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @GetUser() user: User) {
    return this.walletService.remove(user.username, id);
  }
}
