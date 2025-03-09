import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PromoService } from './promo.service';
import { CreatePromoDto, UpdatePromoDto } from './dto/promo.dto';
import { Promo } from './promo.entity';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  @Get()
  async findAll(): Promise<Promo[]> {
    return await this.promoService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Promo> {
    return await this.promoService.findOne(id);
  }

  @Post()
  async create(@Body() createPromoDto: CreatePromoDto): Promise<Promo> {
    return await this.promoService.create(createPromoDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePromoDto: UpdatePromoDto,
  ): Promise<Promo> {
    return await this.promoService.update(id, updatePromoDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return await this.promoService.delete(id);
  }
}
