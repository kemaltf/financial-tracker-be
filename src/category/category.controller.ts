import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.categoryService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(+id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.categoryService.remove(+id);
  }
}
