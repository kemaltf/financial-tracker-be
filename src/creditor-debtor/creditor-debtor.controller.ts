import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { DebtorService } from './creditor-debtor.service';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';

@Controller('debcredtors')
export class DebtorController {
  constructor(private readonly debtorService: DebtorService) {}

  @Post()
  create(@Body() createDebtorDto: CreateDebtorDto) {
    return this.debtorService.create(createDebtorDto);
  }

  @Get()
  findAll() {
    return this.debtorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.debtorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateDebtorDto: UpdateDebtorDto) {
    return this.debtorService.update(+id, updateDebtorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.debtorService.remove(+id);
  }
}
