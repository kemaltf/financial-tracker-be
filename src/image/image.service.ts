import { Injectable } from '@nestjs/common';
import { AWSS3Service } from '../aws/aws-s3.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './image.entity';

@Injectable()
export class ImageService {
  constructor(
    private readonly s3Service: AWSS3Service,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}

  async uploadSingleImage(file: Express.Multer.File): Promise<Image> {
    const uploadResult = await this.s3Service.uploadSingle(
      file.originalname,
      file.buffer,
      file.mimetype,
    );

    const image = this.imageRepository.create({
      key: uploadResult.fileName,
      url: uploadResult.fileUrl,
      size: file.size,
    });

    return await this.imageRepository.save(image);
  }

  async uploadMultipleImages(files: Express.Multer.File[]): Promise<Image[]> {
    const uploadResults = await this.s3Service.uploadMultiple(
      files.map((file) => ({
        fileName: file.originalname,
        file: file.buffer,
        mimeType: file.mimetype,
      })),
    );

    console.log(uploadResults);

    const images = files.map((file, index) =>
      this.imageRepository.create({
        key: uploadResults[index].fileName,
        url: uploadResults[index].url,
        size: file.size,
      }),
    );

    return await this.imageRepository.save(images);
  }
}
