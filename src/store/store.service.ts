import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { User } from 'src/user/user.entity';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { HandleErrors } from '@app/common/decorators';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  @HandleErrors()
  async create(createStoreDto: CreateStoreDto, user: User): Promise<Store> {
    const store = this.storeRepository.create({
      ...createStoreDto,
      userId: user,
    });
    return this.storeRepository.save(store);
  }

  async findAll(username: string): Promise<{ value: number; label: string }[]> {
    const stores = await this.storeRepository.find({
      where: { userId: { username } },
      relations: ['userId'],
    });

    return stores.map((store) => ({
      value: store.id,
      label: store.name,
    }));
  }

  async findOne(username: string, id: number): Promise<Store> {
    const store = await this.storeRepository.findOne({
      where: { id, userId: { username } },
      relations: ['products', 'transactions', 'transactionLogs'],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  async update(
    id: number,
    updateStoreDto: UpdateStoreDto,
    user: User,
  ): Promise<Store> {
    const store = await this.findOne(user.username, id);

    if (store.userId.username !== user.username) {
      throw new ForbiddenException('You can only update your own store');
    }

    const updatedStore = this.storeRepository.merge(store, updateStoreDto);
    return this.storeRepository.save(updatedStore);
  }

  async remove(id: number, user: User): Promise<void> {
    const store = await this.findOne(user.username, id);

    if (store.userId.username !== user.username) {
      throw new ForbiddenException('You can only delete your own store');
    }

    await this.storeRepository.remove(store);
  }
}
