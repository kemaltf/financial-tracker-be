import { SetMetadata } from '@nestjs/common';

export const JWT_ONLY_KEY = 'jwtOnly';
export const JwtOnly = () => SetMetadata(JWT_ONLY_KEY, true);
