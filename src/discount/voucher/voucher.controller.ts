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
import { CreatePromoDto, UpdatePromoDto } from './dto/create-voucher';
import { Voucher } from './voucher.entity';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  async findAll(): Promise<Voucher[]> {
    return await this.voucherService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Voucher> {
    return await this.voucherService.findOne(id);
  }

  @Post()
  async create(
    @Body() createPromoDto: CreatePromoDto,
    @GetUser() user: User,
  ): Promise<Voucher> {
    return await this.voucherService.create(createPromoDto, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePromoDto: UpdatePromoDto,
  ): Promise<Voucher> {
    return await this.voucherService.update(id, updatePromoDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return await this.voucherService.delete(id);
  }
}
