import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AWSS3Service } from '../aws/aws-s3.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './image.entity';
import { HandleErrors } from 'src/common/decorators';
import { GetUser } from '@app/common/decorators/get-user.decorator';
import { User } from '@app/user/user.entity';
import { UploadImageDto } from './dto/upload-image.dto';
import { Store } from '@app/store/store.entity';

@Injectable()
export class ImageService {
  constructor(
    private readonly s3Service: AWSS3Service,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  @HandleErrors()
  async uploadSingleImage(
    file: Express.Multer.File,
    @GetUser() user: User,
    uploadImageDto?: UploadImageDto, // 🔥 Store ID tetap opsional
  ): Promise<Image> {
    let store: Store | null = null;
    if (uploadImageDto?.storeId) {
      console.log('first');
      store = await this.storeRepository.findOne({
        where: { id: uploadImageDto.storeId },
      });
      if (!store) {
        throw new BadRequestException('Store not found');
      }
    }
    const uploadResult = await this.s3Service.uploadSingle(
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    console.log('debug', uploadResult);

    const image = this.imageRepository.create({
      key: uploadResult.fileName,
      url: uploadResult.fileUrl,
      size: file.size,
      mimeType: file.mimetype,
      user: user,
      store,
    });

    return await this.imageRepository.save(image);
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    user: User,
    uploadImageDto?: UploadImageDto, // 🔥 Store ID tetap opsional
  ): Promise<Image[]> {
    let store: Store | null = null;
    if (uploadImageDto.storeId) {
      store = await this.storeRepository.findOne({
        where: { id: uploadImageDto.storeId },
      });
      if (!store) {
        throw new BadRequestException('Store not found');
      }
    }
    const uploadResults = await this.s3Service.uploadMultiple(
      files.map((file) => ({
        fileName: file.originalname,
        file: file.buffer,
        mimeType: file.mimetype,
      })),
    );

    const images = files.map((file, index) =>
      this.imageRepository.create({
        key: uploadResults[index].fileName,
        url: uploadResults[index].url,
        size: file.size,
        mimeType: file.mimetype,
        user: user,
        store,
      }),
    );

    return await this.imageRepository.save(images);
  }

  // Mengambil semua gambar dari database
  async getAllImagesFromDB(user: User, storeId?: number) {
    const whereCondition: any = { user: { id: user.id } };

    if (storeId) {
      whereCondition.store = { id: storeId }; // 🔥 Filter hanya jika storeId ada
    }

    return await this.imageRepository.find({
      where: whereCondition,
      relations: ['user', 'store'],
      select: {
        createdAt: true,
        id: true,
        key: true,
        mimeType: true,
        products: true,
        productVariants: true,
        size: true,
        updatedAt: true,
        url: true,
        user: {},
      },
    });
  }

  // Menghapus gambar dari S3 dan database
  async deleteImage(id: number, user: User): Promise<string> {
    // Cari gambar berdasarkan ID
    const image = await this.imageRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
      select: {
        createdAt: true,
        id: true,
        key: true,
        mimeType: true,
        products: true,
        productVariants: true,
        size: true,
        updatedAt: true,
        url: true,
      },
    });

    if (!image) {
      throw new NotFoundException(`Image with id ${id} not found`);
    }

    // Coba menghapus gambar dari S3
    try {
      const result = await this.s3Service.delete(image.key);

      // Pastikan penghapusan berhasil di S3
      if (result) {
        // Menghapus gambar dari database setelah memastikan file di S3 terhapus
        await this.imageRepository.delete(id);
        return `Image with id ${id} successfully deleted from S3 and database`;
      } else {
        throw new Error('Failed to delete image from S3');
      }
    } catch (error) {
      // Menangani kesalahan saat penghapusan di S3
      throw new NotFoundException(
        `Failed to delete image from S3: ${error.message}`,
      );
    }
  }
}
