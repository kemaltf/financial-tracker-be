import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariantType } from './variant-type.entity';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';

@Injectable()
export class VariantTypeService {
  constructor(
    @InjectRepository(VariantType)
    private readonly variantTypeRepository: Repository<VariantType>,
  ) {}

  // Create a new variant type
  async create(dto: CreateVariantTypeDto): Promise<VariantType> {
    const variantType = this.variantTypeRepository.create(dto);
    return this.variantTypeRepository.save(variantType);
  }

  // Get all variant types
  async findAll(): Promise<VariantType[]> {
    return this.variantTypeRepository.find();
  }

  // Get a single variant type by ID
  async findOne(id: number): Promise<VariantType> {
    const variantType = await this.variantTypeRepository.findOne({
      where: { id },
    });
    if (!variantType) {
      throw new NotFoundException(`Variant Type with ID ${id} not found`);
    }
    return variantType;
  }

  // Update a variant type
  async update(id: number, dto: UpdateVariantTypeDto): Promise<VariantType> {
    await this.findOne(id); // check if exists
    await this.variantTypeRepository.update(id, dto);
    return this.findOne(id);
  }

  // Delete a variant type
  async remove(id: number): Promise<void> {
    const result = await this.variantTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Variant Type with ID ${id} not found`);
    }
  }
}
