import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialPartyCreateDto } from './dto/create-financial-party.dto';
import { UpdateCustomerDto } from './dto/update-financial-party.dto';
import { FinancialParty, Role } from './entity/financial-party.entity';
import { User } from '@app/user/user.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(FinancialParty)
    private readonly financialPartyRepository: Repository<FinancialParty>,
  ) {}

  async findOptAll(
    user: User,
    role?: Role,
  ): Promise<{ value: number; label: string }[]> {
    const financialParties = role
      ? await this.financialPartyRepository.find({
          where: { role, user: { id: user.id } },
          relations: ['user'],
        })
      : await this.financialPartyRepository.find({
          where: { user: { id: user.id } },
          relations: ['user'],
        });

    return financialParties.map((party) => ({
      value: party.id,
      label: `${party.name} - (${party.email})`,
    }));
  }

  async findAll(user: User, role?: Role) {
    const financialParties = role
      ? await this.financialPartyRepository.find({
          where: { role, user: { id: user.id } },
          relations: ['user'],
        })
      : await this.financialPartyRepository.find({
          where: { user: { id: user.id } },
          relations: ['user'],
        });

    return financialParties;
  }

  async findOne(id: number, user: User): Promise<FinancialParty> {
    const financialParty = await this.financialPartyRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: ['user'],
    });
    if (!financialParty) {
      throw new NotFoundException(`Financial Party with ID ${id} not found`);
    }
    return financialParty;
  }

  async create(
    data: FinancialPartyCreateDto,
    user: User,
  ): Promise<FinancialParty> {
    const newFinancialParty = this.financialPartyRepository.create({
      ...data,
      user: user,
    });
    return this.financialPartyRepository.save(newFinancialParty);
  }

  async update(
    id: number,
    data: UpdateCustomerDto,
    user: User,
  ): Promise<FinancialParty> {
    const financialParty = await this.findOne(id, user);
    Object.assign(financialParty, data);
    return this.financialPartyRepository.save(financialParty);
  }

  async remove(id: number, user: User): Promise<void> {
    const financialParty = await this.findOne(id, user);
    await this.financialPartyRepository.remove(financialParty);
  }
}
