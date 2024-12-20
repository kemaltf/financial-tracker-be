import { Module } from '@nestjs/common';
import { AWSS3Service } from './aws-s3.service';

@Module({
  providers: [AWSS3Service],
  exports: [AWSS3Service],
})
export class AWSS3Module {}
