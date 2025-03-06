import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  // Put,
  Delete,
  // Query,
  BadRequestException,
  UseInterceptors,
  UploadedFiles,
  Query,
  Put,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entity/product.entity';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';
import { UpdateProductDto } from './dto/update-product.dto';

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
  async findOne(@Param('id') id: number) {
    return this.productService.getProductDetail(id);
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
      throw new BadRequestException('Invalid data format.');
    }

    // **Validasi DTO dengan class-validator**
    const dtoInstance = plainToInstance(CreateProductDto, parsedData);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // // **Validasi Files**
    // if (!files || files.length === 0) {
    //   throw new BadRequestException('Minimum 1 image must be uploaded.');
    // }

    // **Filter file sesuai kategori**
    const productImages: Express.Multer.File[] = [];
    const variantImagesMap: Record<number, Express.Multer.File[]> = {};

    files.forEach((file) => {
      const productMatch = file.fieldname.match(/^images\[(\d+)\]$/);
      const variantMatch = file.fieldname.match(/^variantImages\[(\d+)\]$/);

      if (productMatch) {
        const index = parseInt(productMatch[1], 10);
        productImages[index] = file;
      } else if (variantMatch) {
        const index = parseInt(variantMatch[1], 10);
        if (!variantImagesMap[index]) {
          variantImagesMap[index] = [];
        }
        variantImagesMap[index].push(file);
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
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: number,
    @Body('data') data: string,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ): Promise<Product> {
    console.log('debug 0', data);
    if (!data) {
      throw new BadRequestException('Data produk harus dikirim.');
    }

    let parsedData: UpdateProductDto;
    try {
      parsedData = JSON.parse(data);
      console.log('debug -1', parsedData);
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Invalid data format.');
    }

    // **Validasi DTO dengan class-validator**
    const dtoInstance = plainToInstance(CreateProductDto, parsedData);
    const errors = await validate(dtoInstance);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    // **Validasi Files**
    // if (!files || files.length === 0) {
    //   throw new BadRequestException('Minimum 1 image must be uploaded.');
    // }

    // **Filter file sesuai kategori**
    const productImages: Express.Multer.File[] = [];
    const variantImagesMap: Record<number, Express.Multer.File[]> = {};

    files.forEach((file) => {
      const productMatch = file.fieldname.match(/^images\[(\d+)\]$/);
      const variantMatch = file.fieldname.match(/^variantImages\[(\d+)\]$/);

      if (productMatch) {
        const index = parseInt(productMatch[1], 10);
        productImages[index] = file;
      } else if (variantMatch) {
        const index = parseInt(variantMatch[1], 10);
        if (!variantImagesMap[index]) {
          variantImagesMap[index] = [];
        }
        variantImagesMap[index].push(file);
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
    console.log('debug-2', parsedData);
    return this.productService.update(
      id,
      parsedData,
      productImages,
      variantImagesMap,
      user,
    );
  }

  // Menghapus produk berdasarkan ID
  @Delete(':id')
  async remove(@Param('id') id: number): Promise<void> {
    return this.productService.remove(id);
  }
}
