import {
  ConflictException,
  ForbiddenException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
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
            if (errno === 1451) {
              // Foreign key constraint error
              throw new ForbiddenException(
                'Unable to delete or update the record because it is still referenced by other records.',
              );
            }
          }
        }

        // Jika error adalah instance dari HttpException atau UnauthorizedException
        if (
          error instanceof HttpException ||
          error instanceof UnauthorizedException ||
          error instanceof NotFoundException ||
          error instanceof ConflictException
        ) {
          throw error;
        }

        // Penanganan error lainnya
        throw new InternalServerErrorException('Internal server error');
      }
    };
  };
}
