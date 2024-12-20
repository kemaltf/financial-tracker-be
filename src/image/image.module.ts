import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Image } from './image.entity';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { AWSS3Module } from 'src/aws/aws-s3.module';

@Module({
  imports: [TypeOrmModule.forFeature([Image]), AWSS3Module],
  providers: [ImageService],
  controllers: [ImageController],
})
export class ImageModule {}
