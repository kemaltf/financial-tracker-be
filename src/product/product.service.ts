import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { Category } from 'src/category/category.entity';
import { Store } from 'src/store/store.entity';
import { VariantType } from 'src/variant/variant-type.entity';
import { Image } from 'src/image/image.entity';
import { Product } from './entity/product.entity';
import { ProductVariant } from './entity/product-variant.entity';
import { HandleErrors } from 'src/common/decorators';
import { randomUUID } from 'crypto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(VariantType)
    private variantTypeRepository: Repository<VariantType>,
    @InjectRepository(Image)
    private imageRepository: Repository<Image>,
  ) {}

  // Function to generate SKU
  private generateSku(name: string): string {
    // Ambil singkatan dari setiap kata dalam nama produk
    const nameParts = name.split(' ');
    const acronym = nameParts
      .map((part) => part.charAt(0).toUpperCase()) // Ambil huruf pertama dari setiap kata
      .join('');

    // Ambil tahun (misal dari bagian akhir nama produk) jika ada
    const year =
      nameParts[nameParts.length - 1] &&
      /\d{4}/.test(nameParts[nameParts.length - 1])
        ? nameParts[nameParts.length - 1]
        : randomUUID().slice(0, 4); // Default tahun jika tidak ada

    // Gabungkan dengan timestamp untuk memastikan keunikan
    const timestamp = Date.now().toString();

    return `${acronym}${year}-${timestamp}`;
  }

  // Method untuk membuat produk beserta variannya
  @HandleErrors()
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Mulai transaksi untuk memastikan konsistensi data
    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. Membuat kategori-kategori berdasarkan ID yang diberikan
        const categories = await transactionalEntityManager.findBy(Category, {
          id: In(createProductDto.categories),
        });

        if (!categories.length) {
          throw new HttpException(
            'Categories/category not found',
            HttpStatus.NOT_FOUND,
          );
        }

        // 2. Menemukan store berdasarkan ID yang diberikan
        const store = await transactionalEntityManager.findOne(Store, {
          where: { id: createProductDto.store },
        });

        if (!store) {
          throw new HttpException('Store not found', HttpStatus.NOT_FOUND);
        }

        // Jika SKU tidak disediakan, buat SKU secara otomatis
        if (!createProductDto.sku) {
          createProductDto.sku = this.generateSku(createProductDto.name);
        } else {
          // 3. Pengecekan SKU apakah sudah ada di database
          const existingProduct = await transactionalEntityManager.findOne(
            Product,
            {
              where: { sku: createProductDto.sku },
            },
          );

          if (existingProduct) {
            throw new ConflictException('SKU already exists'); // Lempar error jika SKU sudah ada
          }
        }

        // 3. Membuat produk
        const product = new Product();
        product.name = createProductDto.name;
        product.sku = createProductDto.sku;
        product.description = createProductDto.description;
        product.stock = createProductDto.stock;
        product.price = createProductDto.price;
        product.store = store;
        product.categories = categories;

        const savedProduct = await transactionalEntityManager.save(
          Product,
          product,
        );

        // 4. Simpan varian produk (jika ada)
        const productVariants = [];
        if (createProductDto.variants && createProductDto.variants.length > 0) {
          for (const variantDto of createProductDto.variants) {
            const variantType = await transactionalEntityManager.findOne(
              VariantType,
              { where: { id: variantDto.variantTypeId } },
            );
            if (!variantType) {
              throw new NotFoundException(
                `VariantType with ID ${variantDto.variantTypeId} not found`,
              );
            }

            // Generate SKU untuk varian jika tidak ada SKU yang diberikan
            if (!variantDto.sku) {
              variantDto.sku = this.generateSku(
                `${createProductDto.name}_${variantDto.variant_value}`,
              );
            } else {
              // Pengecekan SKU untuk varian apakah sudah ada di database
              const existingVariant = await transactionalEntityManager.findOne(
                ProductVariant,
                { where: { sku: variantDto.sku } },
              );

              if (existingVariant) {
                throw new ConflictException(
                  `SKU for variant ${variantDto.sku} already exists`,
                );
              }
            }

            const productVariant = new ProductVariant();
            productVariant.variantType = variantType;
            productVariant.variant_value = variantDto.variant_value;
            productVariant.sku = variantDto.sku;
            productVariant.price = variantDto.price;
            productVariant.stock = variantDto.stock;
            productVariant.product = savedProduct;

            // Simpan gambar varian (jika ada) - Many-to-Many
            if (variantDto.imageIds && variantDto.imageIds.length > 0) {
              const images = await transactionalEntityManager.findBy(Image, {
                id: In(variantDto.imageIds),
              });

              if (images.length !== variantDto.imageIds.length) {
                throw new Error('Some images not found'); // Tangani jika ada ID yang tidak valid
              }

              // Hubungkan gambar ke varian produk (Many-to-Many)
              productVariant.images = images;
              // await transactionalEntityManager.save(Image, productVariant); // Simpan perubahan
            }

            const savedVariant = await transactionalEntityManager.save(
              ProductVariant,
              productVariant,
            );

            productVariants.push(savedVariant);
          }
        }

        // 5. Hubungkan gambar produk utama (jika ada) - Many-to-Many
        if (createProductDto.imageIds && createProductDto.imageIds.length > 0) {
          const images = await transactionalEntityManager.findBy(Image, {
            id: In(createProductDto.imageIds),
          });

          if (images.length !== createProductDto.imageIds.length) {
            throw new HttpException(
              'Some product images not found',
              HttpStatus.NOT_FOUND,
            ); // Tangani jika ada ID gambar yang tidak valid
          }

          // Hubungkan gambar ke produk (Many-to-Many)
          savedProduct.images = images;

          await transactionalEntityManager.save(Product, savedProduct); // Simpan produk dengan gambar
        }
        savedProduct.variants = productVariants;

        console.log(savedProduct);

        // Sanitize: Avoid circular references before returning
        savedProduct.variants.forEach((variant) => {
          variant.product = undefined; // Remove the circular reference
        });

        // Return sanitized product with proper variants
        return savedProduct;
      },
    );
  }

  // Method untuk mengambil semua produk
  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortDirection: 'ASC' | 'DESC' = 'ASC',
    storeId: number,
    filters: Partial<Product> = {},
  ): Promise<{
    data: {
      value: number;
      label: string;
      sku: string;
      description: string;
      stock: string;
      price: number;
    }[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Check if sortBy is a valid column
    const sortableColumns = ['name', 'price', 'stock', 'createdAt'];
    if (!sortableColumns.includes(sortBy)) {
      throw new Error(
        `Invalid sortBy column. Allowed: ${sortableColumns.join(', ')}`,
      );
    }

    const invalidFilters: string[] = [];
    // Filter only valid fields for "where" clause
    const allowedFilters = ['name', 'sku'];
    const validFilters: Partial<Record<keyof Product, any>> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (allowedFilters.includes(key) && value !== undefined) {
        validFilters[key as keyof Product] = value;
      } else {
        invalidFilters.push(key);
      }
    }

    if (invalidFilters.length > 0) {
      throw new BadRequestException(
        `Invalid filter(s): ${invalidFilters.join(', ')}. Allowed filters: ${allowedFilters.join(', ')}`,
      );
    }

    // Build query with relations, filters, sorting, and pagination
    const [data, total] = await this.productRepository.findAndCount({
      where: { ...validFilters, store: { id: storeId } },
      relations: ['categories', 'store', 'variants', 'images'],
      order: { [sortBy]: sortDirection },
      take: limit,
      skip: offset,
    });

    const mappedData = data.map((product) => ({
      value: product.id,
      label: product.name,
      sku: product.sku,
      description: product.description,
      stock: product.sku,
      price: product.price,
      image: product.images[0],
    }));
    return {
      data: mappedData,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Method untuk mengambil satu produk berdasarkan ID
  async findOne(id: number): Promise<Product> {
    return this.productRepository.findOne({ where: { id } });
  }

  @HandleErrors()
  async update(
    productId: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    // Mulai transaksi untuk memastikan konsistensi data
    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. Temukan produk yang akan diperbarui
        const product = await transactionalEntityManager.findOne(Product, {
          where: { id: productId },
          relations: ['categories', 'variants', 'images'], // Termasuk relasi yang relevan
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // 2. Perbarui kategori (jika diberikan)
        if (
          updateProductDto.categories &&
          updateProductDto.categories.length > 0
        ) {
          const categories = await transactionalEntityManager.findBy(Category, {
            id: In(updateProductDto.categories),
          });

          if (!categories.length) {
            throw new HttpException(
              'Some categories not found',
              HttpStatus.NOT_FOUND,
            );
          }
          product.categories = categories;
        }

        // 3. Temukan store berdasarkan ID (jika diperbarui)
        if (updateProductDto.store) {
          const store = await transactionalEntityManager.findOne(Store, {
            where: { id: updateProductDto.store },
          });

          if (!store) {
            throw new NotFoundException('Store not found');
          }
          product.store = store;
        }

        // 4. Perbarui atribut produk
        product.name = updateProductDto.name ?? product.name;
        product.sku = updateProductDto.sku ?? product.sku;
        product.description =
          updateProductDto.description ?? product.description;
        product.stock = updateProductDto.stock ?? product.stock;
        product.price = updateProductDto.price ?? product.price;

        // 5. Perbarui gambar produk utama (jika ada)
        if (updateProductDto.imageIds && updateProductDto.imageIds.length > 0) {
          const images = await transactionalEntityManager.findBy(Image, {
            id: In(updateProductDto.imageIds),
          });

          if (images.length !== updateProductDto.imageIds.length) {
            throw new HttpException(
              'Some product images not found',
              HttpStatus.NOT_FOUND,
            );
          }
          product.images = images;
        }

        // 6. Simpan produk setelah pembaruan
        const updatedProduct = await transactionalEntityManager.save(
          Product,
          product,
        );

        // 7. Perbarui varian produk (jika ada)
        const updatedVariants = [];
        if (updateProductDto.variants && updateProductDto.variants.length > 0) {
          for (const variantDto of updateProductDto.variants) {
            let productVariant: ProductVariant;

            // Periksa apakah varian ini sudah ada atau perlu dibuat
            if (variantDto.id) {
              productVariant = await transactionalEntityManager.findOne(
                ProductVariant,
                { where: { id: variantDto.id }, relations: ['images'] },
              );

              if (!productVariant) {
                throw new NotFoundException(
                  `Variant with ID ${variantDto.id} not found`,
                );
              }
            } else {
              productVariant = new ProductVariant();
            }

            // Temukan atau tetapkan jenis varian
            const variantType = await transactionalEntityManager.findOne(
              VariantType,
              { where: { id: variantDto.variantTypeId } },
            );

            if (!variantType) {
              throw new NotFoundException(
                `VariantType with ID ${variantDto.variantTypeId} not found`,
              );
            }

            productVariant.variantType = variantType;
            productVariant.variant_value =
              variantDto.variant_value ?? productVariant.variant_value;
            productVariant.sku =
              variantDto.sku ??
              this.generateSku(`${product.name}_${variantDto.variant_value}`);
            productVariant.price = variantDto.price ?? productVariant.price;
            productVariant.stock = variantDto.stock ?? productVariant.stock;
            productVariant.product = updatedProduct;

            // Perbarui gambar varian (jika ada)
            if (variantDto.imageIds && variantDto.imageIds.length > 0) {
              const images = await transactionalEntityManager.findBy(Image, {
                id: In(variantDto.imageIds),
              });

              if (images.length !== variantDto.imageIds.length) {
                throw new HttpException(
                  'Some variant images not found',
                  HttpStatus.NOT_FOUND,
                );
              }

              productVariant.images = images;
            }

            // Simpan varian
            const savedVariant = await transactionalEntityManager.save(
              ProductVariant,
              productVariant,
            );

            updatedVariants.push(savedVariant);
          }
        }

        // Sanitize: Hindari referensi melingkar
        updatedProduct.variants = updatedVariants;
        updatedProduct.variants.forEach((variant) => {
          variant.product = undefined;
        });

        // Kembalikan produk yang diperbarui
        return updatedProduct;
      },
    );
  }

  // Method untuk menghapus produk berdasarkan ID
  async remove(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }
}
