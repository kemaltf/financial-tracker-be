import { BadRequestException } from '@nestjs/common';

export function imageFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }
  callback(null, true);
}
