import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { CustomerService } from './financial-party.service';
import { FinancialPartyCreateDto } from './dto/create-financial-party.dto';
import { UpdateCustomerDto } from './dto/update-financial-party.dto';
import { FinancialParty } from './entity/financial-party.entity';

@Controller('financial-party')
export class CustomerController {
  constructor(private readonly financialPartyService: CustomerService) {}

  @Get()
  findAll(): Promise<FinancialParty[]> {
    return this.financialPartyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<FinancialParty> {
    return this.financialPartyService.findOne(id);
  }

  @Post()
  create(@Body() data: FinancialPartyCreateDto): Promise<FinancialParty> {
    return this.financialPartyService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCustomerDto,
  ): Promise<FinancialParty> {
    return this.financialPartyService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.financialPartyService.remove(id);
  }
}
