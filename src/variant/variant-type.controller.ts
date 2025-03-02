import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { VariantTypeService } from './variant-type.service';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('variant-types')
export class VariantTypeController {
  constructor(private readonly variantTypeService: VariantTypeService) {}

  @Post()
  async create(@Body() dto: CreateVariantTypeDto, @GetUser() user: User) {
    return this.variantTypeService.create(dto, user);
  }

  @Get()
  async findAll(@GetUser() user: User, @Query('storeId') storeId: number) {
    console.log('========>', storeId);
    return this.variantTypeService.findAll(user, storeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @GetUser() user: User) {
    return this.variantTypeService.findOne(+id, user);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateVariantTypeDto,
    @GetUser() user: User,
  ) {
    return this.variantTypeService.update(+id, dto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @GetUser() user: User) {
    return this.variantTypeService.remove(+id, user);
  }
}
