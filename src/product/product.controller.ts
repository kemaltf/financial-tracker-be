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
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entity/product.entity';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Mendapatkan semua produk
  @Get('opt')
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
    return this.productService.findAllOpt(
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

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async createProduct(
    @Body('data') data: string,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    if (!data) {
      throw new BadRequestException('Data produk harus dikirim.');
    }

    let parsedData: CreateProductDto;
    try {
      parsedData = JSON.parse(data);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Format data tidak valid.');
    }

    // **Validasi DTO dengan class-validator**
    const dtoInstance = plainToInstance(CreateProductDto, parsedData);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // **Validasi Files**
    if (!files || files.length === 0) {
      throw new BadRequestException('Minimal 1 gambar harus diunggah.');
    }

    // **Filter file sesuai kategori**
    const productImages: Express.Multer.File[] = [];
    const variantImagesMap: Record<number, Express.Multer.File[]> = {};

    files.forEach((file) => {
      if (file.fieldname === 'images') {
        productImages.push(file);
      } else {
        const match = file.fieldname.match(/^variantImages\[(\d+)\]$/);
        if (match) {
          const index = parseInt(match[1], 10);
          if (!variantImagesMap[index]) {
            variantImagesMap[index] = [];
          }
          variantImagesMap[index].push(file);
        }
      }
    });

    // **Validasi jumlah gambar utama**
    if (productImages.length > 5) {
      throw new BadRequestException('Maksimal 5 gambar untuk produk utama.');
    }

    // **Validasi jumlah gambar per varian**
    Object.keys(variantImagesMap).forEach((key) => {
      if (variantImagesMap[Number(key)].length > 3) {
        throw new BadRequestException(
          `Maksimal 3 gambar diperbolehkan untuk varian ${key}.`,
        );
      }
    });

    // **Validasi format file (jpg, png, webp)**
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    files.forEach((file) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Format file tidak didukung: ${file.originalname}. Hanya jpg, png, dan webp diperbolehkan.`,
        );
      }
    });

    return this.productService.create(
      parsedData,
      productImages,
      variantImagesMap,
      user,
    );
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
