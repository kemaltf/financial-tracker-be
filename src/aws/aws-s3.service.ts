import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AWSS3Service {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_REGION'),
  });

  constructor(private readonly configService: ConfigService) {}

  async uploadSingle(fileName: string, file: Buffer, mimeType: string) {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: fileName,
        Body: file,
        ContentType: mimeType,
      }),
    );

    return `https://${this.configService.getOrThrow('AWS_BUCKET_NAME')}.s3.${this.configService.getOrThrow('AWS_REGION')}.amazonaws.com/${fileName}`;
  }

  async uploadMultiple(
    files: { fileName: string; file: Buffer; mimeType: string }[],
  ) {
    const uploadPromises = files.map(({ fileName, file, mimeType }) =>
      this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
          Key: fileName,
          Body: file,
          ContentType: mimeType,
        }),
      ),
    );

    // Tunggu semua upload selesai
    await Promise.all(uploadPromises);

    // Return URLs of all uploaded files
    return files.map(
      ({ fileName }) =>
        `https://${this.configService.getOrThrow('AWS_BUCKET_NAME')}.s3.${this.configService.getOrThrow('AWS_REGION')}.amazonaws.com/${fileName}`,
    );
  }

  async delete(fileName: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: fileName,
      }),
    );

    return `File ${fileName} successfully deleted from ${this.configService.getOrThrow('AWS_BUCKET_NAME')}`;
  }

  async getAll(
    bucket: string,
    prefix: string,
    continuationToken?: string,
    limit = 10,
  ) {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: limit,
      ContinuationToken: continuationToken,
    });

    const response = await this.s3Client.send(command);

    return {
      images: response.Contents.map((content) => ({
        key: content.Key,
        url: `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${content.Key}`,
      })),
      nextContinuationToken: response.NextContinuationToken,
    };
  }
}
