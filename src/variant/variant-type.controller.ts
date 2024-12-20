import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { VariantTypeService } from './variant-type.service';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@Controller('variant-types')
export class VariantTypeController {
  constructor(private readonly variantTypeService: VariantTypeService) {}

  @Post()
  async create(@Body() dto: CreateVariantTypeDto) {
    return this.variantTypeService.create(dto);
  }

  @Get()
  async findAll() {
    return this.variantTypeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.variantTypeService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateVariantTypeDto) {
    return this.variantTypeService.update(+id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.variantTypeService.remove(+id);
  }
}
