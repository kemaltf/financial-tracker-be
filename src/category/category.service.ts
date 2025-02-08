import {
  BadRequestException,
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

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  @HandleErrors()
  async create(dto: CreateCategoryDto): Promise<Category> {
    const store = await this.storeRepository.findOne({
      where: { id: dto.storeId },
    });

    if (!store) {
      throw new BadRequestException('Store not found');
    }

    const category = this.categoryRepository.create({
      ...dto,
      store, // Menetapkan relasi dengan store
    });

    return this.categoryRepository.save(category);
  }

  // Get all categories
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['store'],
    });
  }

  // Get a single category by ID
  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  // Update a category
  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    await this.findOne(id); // check if exists
    await this.categoryRepository.update(id, dto);
    return this.findOne(id);
  }

  // Delete a category
  async remove(id: number): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
