import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { User } from 'src/user/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  async create(@Body() createStoreDto: CreateStoreDto, @GetUser() user: User) {
    return this.storeService.create(createStoreDto, user);
  }

  @Get()
  async findAll(@GetUser() user: User) {
    return this.storeService.findAll(user.username);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @GetUser() user: User) {
    return this.storeService.findOne(user.id, id);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateStoreDto: UpdateStoreDto,
    @GetUser() user: User,
  ) {
    return this.storeService.update(id, updateStoreDto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @GetUser() user: User) {
    return this.storeService.remove(id, user);
  }
}
