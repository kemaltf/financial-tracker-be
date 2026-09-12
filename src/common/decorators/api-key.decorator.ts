import { SetMetadata } from '@nestjs/common';

export const API_KEY_ALLOWED_KEY = 'apiKeyAllowed';
export const ApiKeyAllowed = () => SetMetadata(API_KEY_ALLOWED_KEY, true);
