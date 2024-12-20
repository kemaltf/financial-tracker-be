import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantTypeDto } from './create-variant-type.dto';

export class UpdateVariantTypeDto extends PartialType(CreateVariantTypeDto) {}
