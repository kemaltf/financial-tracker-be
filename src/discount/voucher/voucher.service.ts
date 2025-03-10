import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Voucher } from './voucher.entity';
import { CreatePromoDto, UpdatePromoDto } from './dto/create-voucher';
import { Product } from '@app/product/entity/product.entity';
import { HandleErrors } from '@app/common/decorators';
import { Store } from '@app/store/store.entity';
import { User } from '@app/user/user.entity';

@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly promoRepository: Repository<Voucher>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async findAll(): Promise<Voucher[]> {
    return await this.promoRepository.find();
  }

  async findOne(id: number): Promise<Voucher> {
    const promo = await this.promoRepository.findOne({ where: { id } });
    if (!promo)
      throw new NotFoundException(`Promo dengan ID ${id} tidak ditemukan`);
    return promo;
  }

  @HandleErrors()
  async create(createPromoDto: CreatePromoDto, user: User): Promise<Voucher> {
    const { productIds, storeId, ...promoData } = createPromoDto;

    const store = await this.storeRepository.findOne({
      where: { id: storeId, user: { id: user.id } },
      relations: ['user'],
    });

    if (!store) {
      throw new BadRequestException('Store not found');
    }

    const promo = this.promoRepository.create({ ...promoData, store });

    // Jika applyTo = 'PRODUCT', kita cari produk terkait
    if (promoData.applyTo === 'PRODUCT' && productIds) {
      const products = await this.productRepository.find({
        where: { id: In(productIds) },
      });
      promo.products = products;
    }

    return await this.promoRepository.save(promo);
  }

  async update(id: number, updatePromoDto: UpdatePromoDto): Promise<Voucher> {
    const promo = await this.findOne(id);
    Object.assign(promo, updatePromoDto);
    return await this.promoRepository.save(promo);
  }

  async delete(id: number): Promise<void> {
    const promo = await this.findOne(id);
    await this.promoRepository.remove(promo);
  }
}
