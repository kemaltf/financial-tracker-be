import { Controller, Get, Param } from '@nestjs/common';
import { ApiKeyAllowed } from '@app/common/decorators';
import { TransactionTypeService } from './transaction-type.service';

@ApiKeyAllowed()
@Controller('transaction-types')
export class TransactionTypeController {
  constructor(
    private readonly transactionTypeService: TransactionTypeService,
  ) {}

  @Get()
  async getAllTransactionTypes(): Promise<
    { value: number; label: string; description: string }[]
  > {
    return this.transactionTypeService.getAllTransactionTypes();
  }

  @Get(':id')
  async getTransactionTypeById(
    @Param('id') id: number,
  ): Promise<{ value: number; label: string }> {
    return this.transactionTypeService.getTransactionTypeById(id);
  }
}
