import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/create-voucher';
import { Voucher } from './voucher.entity';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  async findAll(@GetUser() user: User): Promise<Voucher[]> {
    return await this.voucherService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @GetUser() user: User) {
    return await this.voucherService.findOne(id, user);
  }

  @Post()
  async create(
    @Body() createPromoDto: CreateVoucherDto,
    @GetUser() user: User,
  ): Promise<Voucher> {
    return await this.voucherService.create(createPromoDto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePromoDto: UpdateVoucherDto,
    @GetUser() user: User,
  ): Promise<Voucher> {
    return await this.voucherService.update(id, updatePromoDto, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return await this.voucherService.delete(id, user);
  }
}
