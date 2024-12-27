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
        if (error instanceof QueryFailedError) {
          const driverError = error.driverError;

          // Menangani error berdasarkan code
          if (driverError && driverError.errno) {
            const errno = driverError.errno;

            if (errno === 1062) {
              // Duplikat key error
              throw new ForbiddenException('Some field already taken');
            }

            if (errno === '23503') {
              // Foreign key constraint error
              throw new ForbiddenException(
                'Operation failed due to foreign key constraint',
              );
            }
          }
        }

        // Jika error adalah instance dari HttpException atau UnauthorizedException
        if (
          error instanceof HttpException ||
          error instanceof UnauthorizedException
        ) {
          throw error;
        }

        // Penanganan error lainnya
        throw new InternalServerErrorException('Internal server error');
      }
    };
  };
}
