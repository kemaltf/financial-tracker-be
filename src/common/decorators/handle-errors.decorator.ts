import {
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function HandleErrors() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        console.log(error);
        if (error instanceof QueryFailedError) {
          const message = error.message.toLowerCase();

          // Contoh penanganan untuk duplicate key error
          if (message.includes('duplicate key')) {
            throw new ForbiddenException('Some field already taken');
          }

          // Contoh penanganan untuk foreign key constraint error
          if (message.includes('foreign key')) {
            throw new ForbiddenException(
              'Operation failed due to foreign key constraint',
            );
          }
        }

        // Jika error adalah instance dari HttpException, lempar kembali error tersebut
        if (
          error instanceof HttpException ||
          error instanceof UnauthorizedException
        ) {
          throw error;
        }

        // Anda dapat menambahkan logika penanganan error lainnya di sini
        throw new InternalServerErrorException('Internal server error');
      }
    };
  };
}
