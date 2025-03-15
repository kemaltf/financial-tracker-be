import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CreateProductDiscountDto,
  UpdateProductDiscountDto,
} from './dto/create-product-discount';
import { User } from '@app/user/user.entity';
import { Store } from '@app/store/store.entity';
import { ProductDiscount } from './product-discount.entity';
import { Product } from '@app/product/entity/product.entity';
import { HandleErrors } from '@app/common/decorators';

@Injectable()
export class ProductDiscountService {
  constructor(
    @InjectRepository(ProductDiscount)
    private readonly productDiscountRepository: Repository<ProductDiscount>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(user: User): Promise<ProductDiscount[]> {
    // Update isActive menjadi false jika endDate sudah lewat
    this.updateIsActive();

    // Ambil semua diskon yang sesuai dengan user
    return await this.productDiscountRepository.find({
      where: { store: { user } },
      relations: ['store', 'products'],
    });
  }

  async findOne(id: number, user: User): Promise<ProductDiscount> {
    // Update isActive menjadi false jika endDate sudah lewat
    this.updateIsActive();

    const discount = await this.productDiscountRepository.findOne({
      where: { id: id },
      relations: ['store', 'products', 'store.user'],
      select: {
        discountType: true,
        discountValue: true,
        endDate: true,
        eventName: true,
        id: true,
        isActive: true,
        maxDiscount: true,
        products: true,
        startDate: true,
        store: { id: true, user: { id: true } },
      },
    });

    if (!discount || discount.store.user.id !== user.id) {
      throw new NotFoundException(
        'Product discount not found or access denied',
      );
    }
    return discount;
  }

  async create(
    createProductDiscountDto: CreateProductDiscountDto,
    user: User,
  ): Promise<ProductDiscount> {
    const { storeId, productIds, ...discountData } = createProductDiscountDto;

    if (new Date(createProductDiscountDto.startDate) < new Date()) {
      throw new BadRequestException(
        'Start date must be today or in the future.',
      );
    }

    const store = await this.storeRepository.findOne({
      where: { id: storeId, user },
    });
    if (!store) {
      throw new BadRequestException('Store not found or unauthorized');
    }

    let products: Product[] = [];
    if (productIds && productIds.length > 0) {
      // Cek produk yang sudah terdaftar di event lain yang masih aktif

      const existingDiscounts = await this.productDiscountRepository.query(
        `
        SELECT 
          d.id, 
          d.eventName, 
          d.discountType, 
          d.discountValue, 
          d.maxDiscount, 
          d.startDate, 
          d.endDate, 
          d.isActive, 
          d.storeId, 
          GROUP_CONCAT(p.id) AS productIds
        FROM 
          product_discount d
        INNER JOIN 
          product_discount_product pdp ON pdp.product_discount_id = d.id
        INNER JOIN 
          products p ON pdp.product_id = p.id
        WHERE 
          pdp.product_id IN (?) 
          AND d.endDate > NOW()
        GROUP BY 
          d.id;
        `,
        [productIds], // Parameter aman
      );

      console.log('=>', existingDiscounts);
      if (existingDiscounts.length > 0) {
        const conflictedProducts: {
          id: string;
          eventName: string;
        }[] = existingDiscounts.flatMap((d) => {
          const productIds =
            typeof d.productIds === 'string' ? d.productIds.split(',') : [];
          return productIds.map((id) => ({
            id: id.trim(), // Hapus spasi ekstra
            eventName: d.eventName || 'Unknown Event', // Pastikan ada nama event
          }));
        });

        const conflictMessages = conflictedProducts.map(
          (p) => `Product ID ${p.id} is already in event: ${p.eventName}`,
        );

        throw new BadRequestException(conflictMessages.join('; '));
      }

      // Ambil produk yang valid
      products = await this.productRepository.find({
        where: { id: In(productIds), store: { id: storeId } },
      });

      if (products.length !== productIds.length) {
        const foundProductIds = products.map((p) => p.id);
        const missingProductIds = productIds.filter(
          (id) => !foundProductIds.includes(id),
        );

        throw new BadRequestException(
          `Products not found: ${missingProductIds.join(', ')}`,
        );
      }
    }

    const discount = this.productDiscountRepository.create({
      ...discountData,
      store,
      products, // Pastikan properti ini ada
    });

    await this.productDiscountRepository.save(discount);
    return await this.productDiscountRepository.findOne({
      where: { id: discount.id },
      relations: ['store', 'products'],
    });
  }

  async update(
    id: number,
    updateProductDiscountDto: UpdateProductDiscountDto,
    user: User,
  ): Promise<ProductDiscount> {
    const { storeId, productIds, ...discountData } = updateProductDiscountDto;

    const store = await this.storeRepository.findOne({
      where: { id: storeId, user },
    });
    if (!store) {
      throw new BadRequestException('Store not found or unauthorized');
    }

    // Cek apakah event diskon yang akan diperbarui ada
    const discount = await this.productDiscountRepository.findOne({
      where: { id },
      relations: ['store', 'products'],
    });

    if (!discount) {
      throw new BadRequestException('Discount event not found');
    }

    // Pastikan user memiliki akses ke toko
    if (discount.store.id !== storeId) {
      throw new BadRequestException('Unauthorized access to this store');
    }

    let products: Product[] = [];
    if (productIds && productIds.length > 0) {
      // Cek apakah produk yang ingin diperbarui masih aktif di event lain
      const existingDiscounts = await this.productDiscountRepository.query(
        `
        SELECT 
          d.id, 
          d.eventName, 
          GROUP_CONCAT(p.id) AS productIds
        FROM 
          product_discount d
        INNER JOIN 
          product_discount_product pdp ON pdp.product_discount_id = d.id
        INNER JOIN 
          products p ON pdp.product_id = p.id
        WHERE 
          pdp.product_id IN (?) 
          AND d.endDate > NOW()
          AND d.id != ? 
        GROUP BY 
          d.id;
        `,
        [productIds, id], // Pastikan tidak mengecek event diskon yang sedang diperbarui
      );

      if (existingDiscounts.length > 0) {
        const conflictedProducts: { id: string; eventName: string }[] =
          existingDiscounts.flatMap((d) => {
            const productIds =
              typeof d.productIds === 'string' ? d.productIds.split(',') : [];
            return productIds.map((pid) => ({
              id: pid.trim(),
              eventName: d.eventName || 'Unknown Event',
            }));
          });

        const conflictMessages = conflictedProducts.map(
          (p) => `Product ID ${p.id} is already in event: ${p.eventName}`,
        );

        throw new BadRequestException(conflictMessages.join('; '));
      }

      // Ambil produk yang valid
      products = await this.productRepository.find({
        where: { id: In(productIds), store: { id: storeId } },
      });

      if (products.length !== productIds.length) {
        const foundProductIds = products.map((p) => p.id);
        const missingProductIds = productIds.filter(
          (id) => !foundProductIds.includes(id),
        );

        throw new BadRequestException(
          `Products not found: ${missingProductIds.join(', ')}`,
        );
      }
    }

    // Update data
    Object.assign(discount, {
      ...discountData,
      products, // Pastikan produk yang diperbarui di-update
    });

    await this.productDiscountRepository.save(discount);

    return await this.productDiscountRepository.findOne({
      where: { id: discount.id },
      relations: ['store', 'products'],
    });
  }

  async updateIsActive() {
    // Update isActive menjadi false jika endDate sudah lewat
    await this.productDiscountRepository
      .createQueryBuilder()
      .update(ProductDiscount)
      .set({ isActive: false })
      .where('endDate < NOW() AND isActive = true')
      .execute();
  }

  // Delete a category
  @HandleErrors()
  async remove(id: number, user: User): Promise<void> {
    const category = await this.findOne(id, user); // check if exists
    if (category.store.user.id !== user.id) {
      throw new ForbiddenException('You can only update your own category');
    }
    const result = await this.productDiscountRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product discount with ID ${id} not found`);
    }
  }
}
