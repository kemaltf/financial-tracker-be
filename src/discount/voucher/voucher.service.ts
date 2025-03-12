import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Voucher } from './voucher.entity';
import { CreateVoucherDto, UpdateVoucherDto } from './dto/create-voucher';
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
  async findAll(user: User): Promise<Voucher[]> {
    const promos = await this.promoRepository.find({
      where: {
        store: {
          user: {
            id: user.id, // Filter berdasarkan userId
          },
        },
      },
      relations: [
        'store',
        'store.user',
        'products',
        'products.productImages',
        'products.productImages.image',
      ],
      select: {
        id: true,
        code: true,
        applyTo: true,
        discountType: true,
        discountValue: true,
        endDate: true,
        eventName: true,
        isActive: true,
        maxDiscount: true,
        products: {
          id: true,
          name: true,
          sku: true,
          description: true,
          stock: true,
          price: true,
          productImages: true,
        },
        startDate: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil id user
          },
        },
      },
    });

    // Mapping agar hanya mengambil satu gambar per produk
    return promos.map((promo) => ({
      ...promo,
      products: promo.products.map((product) => {
        console.log(product);
        return {
          ...product,
          productImage:
            product.productImages?.length > 0
              ? product.productImages[0].image.url
              : null, // Ambil gambar pertama atau null
          productImages: undefined, // Hapus array productImages dari response
        };
      }),
    }));
  }

  async findOne(id: number, user: User): Promise<Voucher> {
    const promo = await this.promoRepository.findOne({
      where: {
        id,
        store: {
          user: {
            id: user.id, // Filter berdasarkan userId
          },
        },
      },
      relations: [
        'store',
        'store.user',
        'products',
        'products.productImages',
        'products.productImages.image',
      ],
      select: {
        id: true,
        code: true,
        applyTo: true,
        discountType: true,
        discountValue: true,
        endDate: true,
        eventName: true,
        isActive: true,
        maxDiscount: true,
        products: {
          id: true,
          name: true,
          sku: true,
          description: true,
          stock: true,
          price: true,
          productImages: true,
        },
        startDate: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil id user
          },
        },
      },
    });
    if (!promo)
      throw new NotFoundException(`Promo dengan ID ${id} tidak ditemukan`);

    promo.products = promo.products.map((product) => {
      console.log(product);
      return {
        ...product,
        productImage:
          product.productImages?.length > 0
            ? product.productImages[0].image.url
            : null, // Ambil gambar pertama atau null
        productImages: undefined, // Hapus array productImages dari response
      };
    });

    return promo;
  }

  @HandleErrors()
  async create(createPromoDto: CreateVoucherDto, user: User): Promise<Voucher> {
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

    // Simpan promo
    await this.promoRepository.save(promo);

    // Ambil data promo yang sudah disaring
    return await this.promoRepository.findOne({
      where: { id: promo.id },
      relations: ['store', 'store.user', 'products'],
      select: {
        id: true,
        code: true,
        applyTo: true,
        discountType: true,
        discountValue: true,
        endDate: true,
        eventName: true,
        isActive: true,
        maxDiscount: true,
        products: true,
        startDate: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil ID user, tidak menyertakan password atau data sensitif
          },
        },
      },
    });
  }

  async update(
    id: number,
    updatePromoDto: UpdateVoucherDto,
    user: User,
  ): Promise<Voucher> {
    const { productIds, storeId, ...promoData } = updatePromoDto;

    // Cari promo berdasarkan ID
    const promo = await this.promoRepository.findOne({
      where: { id },
      relations: ['store', 'products'],
    });

    if (!promo) {
      throw new NotFoundException('Promo not found');
    }

    // Validasi store jika storeId diberikan
    if (storeId) {
      const store = await this.storeRepository.findOne({
        where: { id: storeId, user: { id: user.id } },
        relations: ['user'],
      });

      if (!store) {
        throw new BadRequestException('Store not found');
      }

      promo.store = store;
    }

    // Jika applyTo = 'PRODUCT', update produk terkait
    if (promoData.applyTo === 'PRODUCT' && productIds) {
      const products = await this.productRepository.find({
        where: { id: In(productIds) },
      });

      promo.products = products;
    }

    // Perbarui data promo
    Object.assign(promo, promoData);
    await this.promoRepository.save(promo);

    // Ambil data promo yang sudah disaring
    return await this.promoRepository.findOne({
      where: { id: promo.id },
      relations: ['store', 'store.user', 'products'],
      select: {
        id: true,
        code: true,
        applyTo: true,
        discountType: true,
        discountValue: true,
        endDate: true,
        eventName: true,
        isActive: true,
        maxDiscount: true,
        products: true,
        startDate: true,
        store: {
          id: true,
          name: true,
          user: {
            id: true, // Hanya mengambil ID user, tidak menyertakan password atau data sensitif
          },
        },
      },
    });
  }

  async delete(id: number, user: User): Promise<void> {
    const promo = await this.findOne(id, user);
    await this.promoRepository.remove(promo);
  }
}
