import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialPartyCreateDto } from './dto/create-financial-party.dto';
import { UpdateCustomerDto } from './dto/update-financial-party.dto';
import { FinancialParty } from './entity/financial-party.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(FinancialParty)
    private readonly financialPartyRepository: Repository<FinancialParty>,
  ) {}

  async findAll(): Promise<FinancialParty[]> {
    return this.financialPartyRepository.find();
  }

  async findOne(id: number): Promise<FinancialParty> {
    const customer = await this.financialPartyRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException(`Financial Party with ID ${id} not found`);
    }
    return customer;
  }

  async create(data: FinancialPartyCreateDto): Promise<FinancialParty> {
    const newCustomer = this.financialPartyRepository.create(data);
    return this.financialPartyRepository.save(newCustomer);
  }

  async update(id: number, data: UpdateCustomerDto): Promise<FinancialParty> {
    const customer = await this.findOne(id);
    Object.assign(customer, data);
    return this.financialPartyRepository.save(customer);
  }

  async remove(id: number): Promise<void> {
    const customer = await this.findOne(id);
    await this.financialPartyRepository.remove(customer);
  }
}
