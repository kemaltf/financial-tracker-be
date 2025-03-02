import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { imageFileFilter } from './image-filter';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';
import { UploadImageDto } from './dto/upload-image.dto';

@Controller('images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('upload-single')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
    }),
  )
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
    @Body() uploadImageDto: UploadImageDto, // 🔥 Gunakan DTO
  ) {
    // Validasi apakah file ada
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.imageService.uploadSingleImage(
      file,
      user,
      uploadImageDto,
    );
  }

  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Maksimal 10 file
      fileFilter: imageFileFilter, // Filter gambar
      limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB per file
    }),
  )
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
    @Body() uploadImageDto: UploadImageDto, // 🔥 Gunakan DTO
  ) {
    // Validasi apakah ada file yang di-upload
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    return await this.imageService.uploadMultipleImages(
      files,
      user,
      uploadImageDto,
    );
  }

  @Get()
  async getAllImages(
    @GetUser() user: User,
    @Query('storeId') storeId?: number,
  ) {
    try {
      const images = await this.imageService.getAllImagesFromDB(user, storeId);
      return { images };
    } catch (error) {
      console.log(error);
      throw new NotFoundException('No images found in the database');
    }
  }

  @Delete(':id')
  async deleteImage(
    @Param('id') id: number,

    @GetUser() user: User,
  ) {
    try {
      const result = await this.imageService.deleteImage(id, user);
      return { message: result };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}
