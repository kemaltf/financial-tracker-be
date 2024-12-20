import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { imageFileFilter } from './image-filter';

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
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return await this.imageService.uploadSingleImage(file);
  }

  @Post('upload-multiple')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Maksimal 10 file
      fileFilter: imageFileFilter, // Filter gambar
      limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB per file
    }),
  )
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    return await this.imageService.uploadMultipleImages(files);
  }
}
