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

  private sanitizeFileName(fileName: string): string {
    const MAX_FILENAME_LENGTH = 50;
    const timestamp = Date.now();

    // Hilangkan spasi, karakter khusus, dan batasi panjang nama file
    const sanitizedFileName = fileName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '')
      .substring(0, MAX_FILENAME_LENGTH);

    return `${timestamp}_${sanitizedFileName}`;
  }

  async uploadSingle(fileName: string, file: Buffer, mimeType: string) {
    const uniqueFileName = this.sanitizeFileName(fileName);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: uniqueFileName,
        Body: file,
        ContentType: mimeType,
      }),
    );

    const fileUrl = `https://${this.configService.getOrThrow(
      'AWS_BUCKET_NAME',
    )}.s3.${this.configService.getOrThrow(
      'AWS_REGION',
    )}.amazonaws.com/${encodeURIComponent(uniqueFileName)}`;

    return { fileName: uniqueFileName, fileUrl };
  }

  async uploadMultiple(
    files: { fileName: string; file: Buffer; mimeType: string }[],
  ) {
    const uploadResults = await Promise.all(
      files.map(async ({ fileName, file, mimeType }) => {
        const uniqueFileName = this.sanitizeFileName(fileName);

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
            Key: uniqueFileName,
            Body: file,
            ContentType: mimeType,
            // ACL: 'public-read', // Atur sesuai kebutuhan
          }),
        );

        return {
          fileName: uniqueFileName,
          url: `https://${this.configService.getOrThrow(
            'AWS_BUCKET_NAME',
          )}.s3.${this.configService.getOrThrow(
            'AWS_REGION',
          )}.amazonaws.com/${encodeURIComponent(uniqueFileName)}`,
        };
      }),
    );

    return uploadResults;
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
