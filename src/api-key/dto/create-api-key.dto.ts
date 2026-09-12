import { IsArray, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiKeyScope } from '../api-key.entity';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsIn(Object.values(ApiKeyScope), { each: true })
  scopes: ApiKeyScope[];
}
