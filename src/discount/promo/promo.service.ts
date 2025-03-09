import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promo } from './promo.entity';
import { CreatePromoDto, UpdatePromoDto } from './dto/promo.dto';

@Injectable()
export class PromoService {
  constructor(
    @InjectRepository(Promo)
    private readonly promoRepository: Repository<Promo>,
  ) {}

  async findAll(): Promise<Promo[]> {
    return await this.promoRepository.find();
  }

  async findOne(id: number): Promise<Promo> {
    const promo = await this.promoRepository.findOne({ where: { id } });
    if (!promo)
      throw new NotFoundException(`Promo dengan ID ${id} tidak ditemukan`);
    return promo;
  }

  async create(createPromoDto: CreatePromoDto): Promise<Promo> {
    const promo = this.promoRepository.create(createPromoDto);
    return await this.promoRepository.save(promo);
  }

  async update(id: number, updatePromoDto: UpdatePromoDto): Promise<Promo> {
    const promo = await this.findOne(id);
    Object.assign(promo, updatePromoDto);
    return await this.promoRepository.save(promo);
  }

  async delete(id: number): Promise<void> {
    const promo = await this.findOne(id);
    await this.promoRepository.remove(promo);
  }
}
