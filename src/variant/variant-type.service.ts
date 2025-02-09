import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariantType } from './variant-type.entity';
import { CreateVariantTypeDto } from './dto/create-variant-type.dto';
import { UpdateVariantTypeDto } from './dto/update-variant-type.dto';
import { User } from '@app/user/user.entity';
import { Store } from '@app/store/store.entity';
import { HandleErrors } from '@app/common/decorators';

@Injectable()
export class VariantTypeService {
  constructor(
    @InjectRepository(VariantType)
    private readonly variantTypeRepository: Repository<VariantType>,

    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  // Create a new variant type
  @HandleErrors()
  async create(dto: CreateVariantTypeDto, user: User): Promise<VariantType> {
    const store = await this.storeRepository.findOne({
      where: { id: dto.storeId, user: { id: user.id } },
      relations: ['user'],
    });

    if (!store) {
      throw new BadRequestException('Store not found');
    }

    const variantType = await this.variantTypeRepository.create({
      ...dto,
      store,
    });

    const result = await this.variantTypeRepository.save(variantType);

    console.log('==', result);
    return this.findOne(result.id, user);
  }

  // Get all variant types
  async findAll(user: User): Promise<VariantType[]> {
    return this.variantTypeRepository.find({
      where: {
        store: {
          user: {
            id: user.id, // Filter berdasarkan userId
          },
        },
      },
      relations: ['store', 'store.user'], // Pastikan user tetap bisa diakses
      select: {
        id: true,
        name: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil id user
          },
        },
      },
    });
  }

  // Get a single variant type by ID
  async findOne(id: number, user: User): Promise<VariantType> {
    const variantType = await this.variantTypeRepository.findOne({
      where: {
        id,
        store: {
          user: {
            id: user.id, // Filter berdasarkan userId
          },
        },
      },
      relations: ['store', 'store.user'],
      select: {
        id: true,
        name: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil id user
          },
        },
      },
    });
    console.log('++++++++++', variantType);
    if (!variantType) {
      throw new NotFoundException(`Variant Type with ID ${id} not found`);
    }
    return variantType;
  }

  // Update a variant type
  async update(
    id: number,
    dto: UpdateVariantTypeDto,
    user: User,
  ): Promise<VariantType> {
    const variantType = await this.findOne(id, user); // check if exists
    if (variantType.store.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own category');
    }
    await this.findOne(id, user); // check if exists
    await this.variantTypeRepository.update(id, dto);
    return this.findOne(id, user);
  }

  // Delete a variant type
  async remove(id: number, user: User): Promise<void> {
    const variantType = await this.findOne(id, user); // check if exists
    if (variantType.store.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own category');
    }
    const result = await this.variantTypeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Variant Type with ID ${id} not found`);
    }
  }
}
