import { PartialType } from '@nestjs/mapped-types';
import { FinancialPartyCreateDto } from './create-financial-party.dto';

export class UpdateCustomerDto extends PartialType(FinancialPartyCreateDto) {}
