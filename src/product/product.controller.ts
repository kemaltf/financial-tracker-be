import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entity/product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Mendapatkan semua produk
  @Get()
  async findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('sortBy') sortBy: string,
    @Query('sortDirection') sortDirection: 'ASC' | 'DESC',
    @Query('storeId') storeId: number,
    @Query('filters') filters: Record<string, any>,
  ) {
    if (!storeId) {
      throw new BadRequestException('storeId is required');
    }
    return this.productService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      sortBy || 'name',
      sortDirection || 'ASC',
      storeId,
      filters,
    );
  }

  // Mendapatkan produk berdasarkan ID
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Product> {
    return this.productService.findOne(id);
  }

  // Menambahkan produk baru beserta beberapa varian produk
  @Post()
  async create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  // Mengupdate produk berdasarkan ID
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateProductDto: any,
  ): Promise<Product> {
    return this.productService.update(id, updateProductDto);
  }

  // Menghapus produk berdasarkan ID
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.productService.remove(id);
  }
}
