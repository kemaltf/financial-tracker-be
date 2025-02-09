import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CustomerService } from './financial-party.service';
import { FinancialPartyCreateDto } from './dto/create-financial-party.dto';
import { UpdateCustomerDto } from './dto/update-financial-party.dto';
import { FinancialParty, Role } from './entity/financial-party.entity';
import { User } from '@app/user/user.entity';
import { GetUser } from '@app/common/decorators/get-user.decorator';

@Controller('financial-party')
export class CustomerController {
  constructor(private readonly financialPartyService: CustomerService) {}

  @Get('/opt')
  findOptAll(
    @GetUser() user: User,
    @Query('role') role?: Role,
  ): Promise<{ value: number; label: string }[]> {
    if (role && !Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    return this.financialPartyService.findOptAll(user, role);
  }

  @Get('/')
  findAll(@GetUser() user: User, @Query('role') role?: Role) {
    if (role && !Object.values(Role).includes(role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    return this.financialPartyService.findAll(user, role);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<FinancialParty> {
    return this.financialPartyService.findOne(id, user);
  }

  @Post()
  create(
    @Body() data: FinancialPartyCreateDto,
    @GetUser() user: User,
  ): Promise<FinancialParty> {
    return this.financialPartyService.create(data, user);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCustomerDto,
    @GetUser() user: User,
  ): Promise<FinancialParty> {
    return this.financialPartyService.update(id, data, user);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.financialPartyService.remove(id, user);
  }
}
