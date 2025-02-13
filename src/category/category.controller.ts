import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { User } from '@app/user/user.entity';
import { GetUser } from '@app/common/decorators/get-user.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto, @GetUser() user: User) {
    const result = await this.categoryService.create(dto, user);
    return result;
  }

  @Get()
  async findAll(@GetUser() user: User) {
    return this.categoryService.findAll(user);
  }

  @Get('opt')
  async findAllOpt(@GetUser() user: User, @Query('storeId') storeId: number) {
    return this.categoryService.findAllOpt(user, storeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @GetUser() user: User) {
    const result = await this.categoryService.findOne(+id, user);
    return result;
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateCategoryDto,
    @GetUser() user: User,
  ) {
    const result = await this.categoryService.update(+id, dto, user);
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @GetUser() user: User) {
    return this.categoryService.remove(+id, user);
  }
}
