import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  CreateProductDiscountDto,
  UpdateProductDiscountDto,
} from './dto/create-product-discount';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';
import { ProductDiscount } from './product-discount.entity';
import { ProductDiscountService } from './product-discount.service';

@Controller('product-discounts')
export class ProductDiscountController {
  constructor(
    private readonly productDiscountService: ProductDiscountService,
  ) {}

  @Get()
  async findAll(@GetUser() user: User): Promise<ProductDiscount[]> {
    return await this.productDiscountService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @GetUser() user: User) {
    console.log('id', id);
    return await this.productDiscountService.findOne(id, user);
  }

  @Post()
  async create(
    @Body() createProductDiscountDto: CreateProductDiscountDto,
    @GetUser() user: User,
  ): Promise<ProductDiscount> {
    return await this.productDiscountService.create(
      createProductDiscountDto,
      user,
    );
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() updateProductDiscountDto: UpdateProductDiscountDto,
    @GetUser() user: User,
  ): Promise<ProductDiscount> {
    return await this.productDiscountService.update(
      id,
      updateProductDiscountDto,
      user,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: number, @GetUser() user: User): Promise<void> {
    return await this.productDiscountService.remove(id, user);
  }
}
