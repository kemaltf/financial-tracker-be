import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebtsAndReceivables } from './debts-and-receivables.entity';
import { CreateDebtDto } from './dto/create-debt.dto';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Injectable()
export class DebtsAndReceivablesService {
  constructor(
    @InjectRepository(DebtsAndReceivables)
    private readonly debtsRepository: Repository<DebtsAndReceivables>,
  ) {}

  async create(createDebtDto: CreateDebtDto): Promise<DebtsAndReceivables> {
    const debt = this.debtsRepository.create(createDebtDto);
    return this.debtsRepository.save(debt);
  }

  async findAll(): Promise<DebtsAndReceivables[]> {
    return this.debtsRepository.find({ relations: ['user', 'transaction'] });
  }

  async findOne(id: number): Promise<DebtsAndReceivables> {
    const debt = await this.debtsRepository.findOne({
      where: { id },
      relations: ['user', 'transaction'],
    });
    if (!debt) {
      throw new NotFoundException(`Debt/Receivable with ID ${id} not found`);
    }
    return debt;
  }

  async update(
    id: number,
    updateDebtDto: UpdateDebtDto,
  ): Promise<DebtsAndReceivables> {
    const debt = await this.findOne(id);
    Object.assign(debt, updateDebtDto);
    return this.debtsRepository.save(debt);
  }

  async remove(id: number): Promise<void> {
    const debt = await this.findOne(id);
    await this.debtsRepository.remove(debt);
  }
}
