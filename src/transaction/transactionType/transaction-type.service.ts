import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionType } from './transaction-type.entity';

@Injectable()
export class TransactionTypeService {
  constructor(
    @InjectRepository(TransactionType)
    private transactionTypeRepository: Repository<TransactionType>,
  ) {}

  async getAllTransactionTypes(): Promise<
    { value: number; label: string; description: string }[]
  > {
    const transactionTypes = await this.transactionTypeRepository.find();
    return transactionTypes.map((type) => ({
      value: type.id,
      label: type.name,
      description: type.description,
    }));
  }

  async getTransactionTypeById(
    id: number,
  ): Promise<{ value: number; label: string }> {
    const type = await this.transactionTypeRepository.findOne({
      where: { id },
    });
    return {
      value: type.id,
      label: type.name,
    };
  }
}
