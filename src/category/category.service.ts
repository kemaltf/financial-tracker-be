import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { HandleErrors } from '@app/common/decorators';
import { Store } from '@app/store/store.entity';
import { User } from '@app/user/user.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  @HandleErrors()
  async create(dto: CreateCategoryDto, user: User): Promise<Category> {
    const store = await this.storeRepository.findOne({
      where: { id: dto.storeId, user: { id: user.id } },
      relations: ['user'],
    });

    if (!store) {
      throw new BadRequestException('Store not found');
    }

    const category = this.categoryRepository.create({
      ...dto,
      store, // Menetapkan relasi dengan store
    });

    const result = await this.categoryRepository.save(category);
    return this.findOne(result.id, user);
  }

  // Get all categories
  async findAll(user: User): Promise<Category[]> {
    return await this.categoryRepository.find({
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
        description: true,
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

  // Get a single category by ID
  async findOne(id: number, user: User): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: {
        id: id,
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
        description: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil id user
          },
        },
      },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  // Update a category
  async update(
    id: number,
    dto: UpdateCategoryDto,
    user: User,
  ): Promise<Category> {
    const category = await this.findOne(id, user); // check if exists

    if (category.store.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own category');
    }
    Object.assign(category, dto);
    await this.categoryRepository.save(category);
    return this.findOne(id, user);
  }

  // Delete a category
  async remove(id: number, user: User): Promise<void> {
    const category = await this.findOne(id, user); // check if exists
    if (category.store.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own category');
    }
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
