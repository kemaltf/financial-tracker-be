import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebtorCreditor } from './creditor-debtor.entity';
import { CreateDebtorDto } from './dto/create-debtor.dto';
import { UpdateDebtorDto } from './dto/update-debtor.dto';

@Injectable()
export class DebtorService {
  constructor(
    @InjectRepository(DebtorCreditor)
    private readonly debtorRepository: Repository<DebtorCreditor>,
  ) {}

  async create(createDebtorDto: CreateDebtorDto): Promise<DebtorCreditor> {
    const debtor = this.debtorRepository.create(createDebtorDto);
    return this.debtorRepository.save(debtor);
  }

  async findAll(): Promise<DebtorCreditor[]> {
    return this.debtorRepository.find();
  }

  async findOne(id: number): Promise<DebtorCreditor> {
    const debtor = await this.debtorRepository.findOne({ where: { id } });
    if (!debtor) {
      throw new NotFoundException(`Debtor with ID ${id} not found`);
    }
    return debtor;
  }

  async update(
    id: number,
    updateDebtorDto: UpdateDebtorDto,
  ): Promise<DebtorCreditor> {
    const debtor = await this.findOne(id);
    Object.assign(debtor, updateDebtorDto);
    return this.debtorRepository.save(debtor);
  }

  async remove(id: number): Promise<void> {
    const result = await this.debtorRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Debtor with ID ${id} not found`);
    }
  }
}
