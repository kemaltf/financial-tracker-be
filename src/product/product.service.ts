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
import { Product } from './entity/product.entity';
import { HandleErrors } from 'src/common/decorators';
import { randomUUID } from 'crypto';
import { User } from '@app/user/user.entity';
import { ImageService } from '@app/image/image.service';
import { ProductVariant } from './entity/product-variant.entity';
import { Image } from '@app/image/image.entity';
import { VariantName } from '@app/variant/variant-name.entity';
import { VariantOption } from './entity/variant-option.entity';
import { ProductVariantOptions } from './entity/product-variant-option.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImage } from './entity/product-images.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,

    private imageService: ImageService,
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

  @HandleErrors()
  async create(
    createProductDto: CreateProductDto,
    productImages: Express.Multer.File[],
    variantImagesMap: Record<number, Express.Multer.File[]>,
    user: User,
  ) {
    // ========== IMAGE PARENT UPLOAD ===========
    let productImagesUploaded: Image[] = [];
    if (productImages.length > 0) {
      productImagesUploaded = await this.imageService.uploadMultipleImages(
        productImages,
        user,
        {
          storeId: createProductDto.storeId,
        },
      );
    }
    // Pastikan imageIds tidak null/undefined sebelum digabungkan
    const updatedImageIds: (number | undefined)[] = [
      ...(createProductDto.imageIds ?? []),
    ];

    // Gabungkan berdasarkan indeks yang sesuai
    productImagesUploaded.forEach((image, index) => {
      updatedImageIds[index] = image.id;
    });

    // Simpan hasilnya kembali ke DTO
    createProductDto.imageIds = updatedImageIds.filter(
      (id) => id !== undefined && id !== null,
    );

    // ========= IMAGE VARIANT UPLOAD ============
    const variantImageIdsMap: Record<number, number[]> = {};
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      for (const [variantIndex, images] of Object.entries(variantImagesMap)) {
        const uploadedVariantImages =
          await this.imageService.uploadMultipleImages(images, user, {
            storeId: createProductDto.storeId,
          });

        variantImageIdsMap[parseInt(variantIndex, 10)] =
          uploadedVariantImages.map((image) => image.id);
      }
      // Simpann hasil savenya ke imageIds
      createProductDto.variants = createProductDto.variants.map(
        (variant, index) => ({
          ...variant,
          imageIds: variantImageIdsMap[index] || [],
        }),
      );
    }

    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // ========== STORE ==========
        const store = await transactionalEntityManager.findOne(Store, {
          where: { id: createProductDto.storeId },
        });
        if (!store) {
          throw new NotFoundException('Store not found');
        }

        // ========== CATEGORIES ==========
        const categories = await transactionalEntityManager.findBy(Category, {
          id: In(createProductDto.categories),
        });
        if (categories.length !== createProductDto.categories.length) {
          throw new NotFoundException('Some categories not found');
        }

        // ========== SKU ============
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

        // ========== PRODUCT ==========
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

        // ======== LINK IMAGE PRODUCT PARENT =========
        if (createProductDto.imageIds && createProductDto.imageIds.length > 0) {
          const images = await transactionalEntityManager
            .createQueryBuilder(Image, 'image')
            .where('image.id IN (:...ids)', { ids: createProductDto.imageIds })
            .orderBy(`FIELD(image.id, ${createProductDto.imageIds.join(',')})`)
            .getMany();

          if (images.length !== createProductDto.imageIds.length) {
            throw new HttpException(
              'Some product images not found',
              HttpStatus.NOT_FOUND,
            ); // Tangani jika ada ID gambar yang tidak valid
          }

          // Hapus relasi lama jika ada (untuk update)
          await transactionalEntityManager.delete(ProductImage, {
            product: savedProduct,
          });

          // Simpan gambar dengan urutan
          for (let i = 0; i < createProductDto.imageIds.length; i++) {
            const productImage = new ProductImage();
            productImage.product = savedProduct;
            productImage.image = images.find(
              (img) => img.id === createProductDto.imageIds[i],
            );
            productImage.order = i; // Simpan urutan sesuai input

            await transactionalEntityManager.save(ProductImage, productImage);
          }
        }

        // ======== PRODUCT VARIANT =============
        const productVariants: ProductVariant[] = [];
        if (createProductDto.variants && createProductDto.variants.length > 0) {
          for (const variantDto of createProductDto.variants) {
            // Ambil semua variantType berdasarkan key dari variantOptions
            const variantTypeNames = Object.keys(variantDto.variantOptions); // e.g [ 'COLOR', 'SIZE' ]
            const variantTypes = await transactionalEntityManager.findBy(
              VariantType,
              {
                name: In(variantTypeNames),
              },
            );

            if (variantTypes.length !== variantTypeNames.length) {
              throw new NotFoundException('Some VariantType names not found');
            }

            // Cek dan Buat VariantName & VariantOption jika belum ada
            const variantOptions: VariantOption[] = [];
            // Object entries convert from { "COLOR": "Red", "SIZE": "M" } to [ [ 'COLOR', 'Red' ], [ 'SIZE', 'M' ] ]
            for (const [variantTypeName, variantValue] of Object.entries(
              variantDto.variantOptions,
            )) {
              const variantType = variantTypes.find(
                (vt) => vt.name === variantTypeName,
              );

              if (!variantType) {
                throw new NotFoundException(
                  `VariantType ${variantTypeName} not found`,
                );
              }

              // find variant name
              let variantName = await transactionalEntityManager.findOne(
                VariantName,
                {
                  where: {
                    name: variantValue,
                    variantType: { id: variantType.id },
                  },
                  relations: ['variantType'],
                },
              );

              if (!variantName) {
                // Jika tidak ada, buat baru
                variantName = new VariantName();
                variantName.name = variantValue;
                variantName.variantType = variantType;

                variantName = await transactionalEntityManager.save(
                  VariantName,
                  variantName,
                );
              }

              // Cek dan buat VariantOption jika belum ada
              let variantOption = await transactionalEntityManager.findOne(
                VariantOption,
                {
                  where: { variantName: { id: variantName.id } },
                  relations: ['variantName'],
                },
              );

              if (!variantOption) {
                variantOption = new VariantOption();
                variantOption.variantName = variantName;
                variantOption = await transactionalEntityManager.save(
                  VariantOption,
                  variantOption,
                );
                console.log('variantOption', variantOption);
              }
              console.log('debug here?', variantOption);
              variantOptions.push(variantOption); // [ VariantOption { id: 1 }, VariantOption { id: 2 } ]
            }

            // Generate SKU jika tidak disediakan
            if (!variantDto.sku) {
              variantDto.sku = this.generateSku(
                `${createProductDto.name}-${Object.values(variantDto.variantOptions).join('-')}`,
              );
            } else {
              const existingVariant = await transactionalEntityManager.findOne(
                ProductVariant,
                {
                  where: { sku: variantDto.sku },
                },
              );

              if (existingVariant) {
                throw new ConflictException(
                  `SKU for variant ${variantDto.sku} already exists`,
                );
              }
            }

            console.log('debug', variantOptions);
            // Gabungkan nama variant menjadi format yang diinginkan
            const variantNamesString = variantOptions
              .map((vo) => vo.variantName.name)
              .join(', ');

            // Buat varian produk
            const productVariant = new ProductVariant();
            productVariant.product = savedProduct;
            productVariant.sku = variantDto.sku;
            productVariant.price = variantDto.price;
            productVariant.stock = variantDto.stock;
            productVariant.store = store;
            productVariant.name = `${savedProduct.name} - (${variantNamesString})`;

            // Simpan gambar varian (jika ada) - Many-to-Many
            if (variantDto.imageIds && variantDto.imageIds.length > 0) {
              const images = await transactionalEntityManager.findBy(Image, {
                id: In(variantDto.imageIds),
              });

              if (images.length !== variantDto.imageIds.length) {
                throw new NotFoundException('Some variant images not found'); // Tangani jika ada ID yang tidak valid
              }

              productVariant.images = images;
            }

            const savedVariant = await transactionalEntityManager.save(
              ProductVariant,
              productVariant,
            );
            productVariants.push(savedVariant);

            // Simpan ProductVariantOptions untuk menghubungkan variant dengan productVariant
            for (const variantOption of variantOptions) {
              const productVariantOption = new ProductVariantOptions();
              productVariantOption.productVariant = savedVariant;
              productVariantOption.variantOption =
                variantOption as VariantOption;

              await transactionalEntityManager.save(
                ProductVariantOptions,
                productVariantOption,
              );
            }
          }
        }

        // ====== RETURN TO THE USER =========
        savedProduct.variants = productVariants;

        // Sanitize: Avoid circular references before returning
        savedProduct.variants.forEach((variant) => {
          variant.product = undefined; // Remove the circular reference
        });
        return savedProduct;
      },
    );
  }

  @HandleErrors()
  async findAllOpt(
    page = 1,
    limit = 10,
    sortBy = 'name',
    sortDirection: 'ASC' | 'DESC' = 'ASC',
    storeId: number,
    filters: Partial<Product> = {},
  ) {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Check if sortBy is a valid column
    const sortableColumns = ['name', 'price', 'stock', 'createdAt'];
    if (!sortableColumns.includes(sortBy)) {
      throw new BadRequestException(
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
      relations: [
        'categories',
        'store',
        'variants',
        'productImages.image', // Gambar produk dari pivot
        'variants.images',
      ],
      order: { [sortBy]: sortDirection },
      take: limit,
      skip: offset,
    });

    const mappedData = data.map((product) => ({
      value: product.id,
      label: product.name,
      sku: product.sku,
      description: product.description,
      stock: product.stock,
      price: product.price,
      image: product.productImages
        .sort((a, b) => a.order - b.order) // Urutkan gambar dari pivot
        ?.at(0)?.image.url, // Ambil gambar pertama
      id: product.id,

      variant: product.variants.map((variant) => ({
        value: `${product.id}-${variant.id}`, // Kombinasi parentId-variantId
        label: `${variant.name}`,
        sku: variant.sku,
        description: product.description,
        stock: variant.stock,
        price: variant.price,
        image: variant.images?.[0]?.url, // Bisa pakai gambar dari parent
        id: variant.id,
      })),
    }));

    return {
      data: mappedData,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  @HandleErrors()
  async update(
    productId: number,
    updateProductDto: UpdateProductDto,
    productImages: Express.Multer.File[],
    variantImagesMap: Record<number, Express.Multer.File[]>,
    user: User,
  ) {
    // ======= FIND PRODUCT ============
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: [
        'store',
        'categories',
        'productImages.image', // Ambil relasi gambar melalui pivot productImages
        'variants',
        'variants.images',
      ],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    console.log('DEBUG=>', updateProductDto);

    // ========= IMAGE PARENT UPLOAD ===========
    let productImagesUploaded: Image[] = [];
    if (productImages.length > 0) {
      productImagesUploaded = await this.imageService.uploadMultipleImages(
        productImages,
        user,
        {
          storeId: product.store.id,
        },
      );
    }
    // Pastikan imageIds tidak null/undefined sebelum digabungkan
    const updatedImageIds: (number | undefined)[] = [
      ...(updateProductDto.imageIds ?? []),
    ];

    // Gabungkan berdasarkan indeks yang sesuai
    productImagesUploaded.forEach((image, index) => {
      updatedImageIds[index] = image.id;
    });

    updateProductDto.imageIds = updatedImageIds.filter(
      (id) => id !== undefined,
    );

    // ========= IMAGE VARIANT UPLOAD ============
    const variantImageIdsMap: Record<number, number[]> = {};

    if (updateProductDto.variants && updateProductDto.variants.length > 0) {
      for (const [variantIndex, images] of Object.entries(variantImagesMap)) {
        const uploadedVariantImages =
          await this.imageService.uploadMultipleImages(images, user, {
            storeId: product.store.id,
          });

        variantImageIdsMap[parseInt(variantIndex, 10)] =
          uploadedVariantImages.map((image) => image.id);
      }

      // ✅ Pastikan imageIds tetap menyimpan ID yang sudah ada
      updateProductDto.variants = updateProductDto.variants.map(
        (variant, index) => {
          const existingImageIds = variant.imageIds ?? []; // Simpan ID yang sudah ada
          const newImageIds = variantImageIdsMap[index] || []; // Tambahkan yang baru

          return {
            ...variant,
            imageIds: [...existingImageIds, ...newImageIds].filter(
              (id) => id !== null,
            ), // Gabungkan dan pastikan tidak ada null
          };
        },
      );
    }

    console.log('debug 10,', updateProductDto);

    return await this.productRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // ========= UPDATE PRODUCT DETAILS ==========
        product.name = updateProductDto.name ?? product.name;
        product.sku = updateProductDto.sku?.trim() || product.sku;
        product.description =
          updateProductDto.description ?? product.description;
        product.stock = updateProductDto.stock ?? product.stock;
        product.price = updateProductDto.price ?? product.price;
        product.categories = await transactionalEntityManager.findBy(Category, {
          id: In(
            updateProductDto.categories ?? product.categories.map((c) => c.id),
          ),
        });

        const updatedProduct = await transactionalEntityManager.save(
          Product,
          product,
        );

        console.log('DEBUG 2', updateProductDto);
        if (updateProductDto.imageIds && updateProductDto.imageIds.length > 0) {
          const images = await transactionalEntityManager
            .createQueryBuilder(Image, 'image')
            .where('image.id IN (:...ids)', { ids: updateProductDto.imageIds })
            .orderBy(`FIELD(image.id, ${updateProductDto.imageIds.join(',')})`)
            .getMany();

          console.log('debug 9', images);

          if (images.length !== updateProductDto.imageIds.length) {
            throw new HttpException(
              'Some product images not found',
              HttpStatus.NOT_FOUND,
            ); // Tangani jika ada ID gambar yang tidak valid
          }

          // Hapus relasi lama agar tidak duplikasi
          await transactionalEntityManager.delete(ProductImage, {
            product: updatedProduct,
          });

          // Simpan gambar dengan urutan yang benar
          for (let i = 0; i < updateProductDto.imageIds.length; i++) {
            const productImage = new ProductImage();
            productImage.product = updatedProduct;
            productImage.image = images.find(
              (img) => img.id === updateProductDto.imageIds[i],
            );
            productImage.order = i; // Simpan urutan sesuai input

            await transactionalEntityManager.save(ProductImage, productImage);
          }
        }

        // ======== UPDATE PRODUCT VARIANTS =============
        // 🔹 **Step 1: Hapus semua variants lama**
        await transactionalEntityManager.delete(ProductVariant, {
          product: { id: productId },
        });

        // ======== PRODUCT VARIANT =============
        const productVariants: ProductVariant[] = [];
        if (updateProductDto.variants && updateProductDto.variants.length > 0) {
          for (const variantDto of updateProductDto.variants) {
            // Ambil semua variantType berdasarkan key dari variantOptions
            const variantTypeNames = Object.keys(variantDto.variantOptions); // e.g [ 'COLOR', 'SIZE' ]
            const variantTypes = await transactionalEntityManager.findBy(
              VariantType,
              {
                name: In(variantTypeNames),
              },
            );

            if (variantTypes.length !== variantTypeNames.length) {
              throw new NotFoundException('Some VariantType names not found');
            }

            // Cek dan Buat VariantName & VariantOption jika belum ada
            const variantOptions: VariantOption[] = [];
            // Object entries convert from { "COLOR": "Red", "SIZE": "M" } to [ [ 'COLOR', 'Red' ], [ 'SIZE', 'M' ] ]
            for (const [variantTypeName, variantValue] of Object.entries(
              variantDto.variantOptions,
            )) {
              const variantType = variantTypes.find(
                (vt) => vt.name === variantTypeName,
              );

              if (!variantType) {
                throw new NotFoundException(
                  `VariantType ${variantTypeName} not found`,
                );
              }

              // find variant name
              let variantName = await transactionalEntityManager.findOne(
                VariantName,
                {
                  where: {
                    name: variantValue,
                    variantType: { id: variantType.id },
                  },
                  relations: ['variantType'],
                },
              );

              if (!variantName) {
                // Jika tidak ada, buat baru
                variantName = new VariantName();
                variantName.name = variantValue;
                variantName.variantType = variantType;

                variantName = await transactionalEntityManager.save(
                  VariantName,
                  variantName,
                );
              }

              // Cek dan buat VariantOption jika belum ada
              let variantOption = await transactionalEntityManager.findOne(
                VariantOption,
                {
                  where: { variantName: { id: variantName.id } },
                  relations: ['variantName'],
                },
              );

              if (!variantOption) {
                variantOption = new VariantOption();
                variantOption.variantName = variantName;
                variantOption = await transactionalEntityManager.save(
                  VariantOption,
                  variantOption,
                );
                console.log('variantOption', variantOption);
              }
              console.log('debug here?', variantOption);
              variantOptions.push(variantOption); // [ VariantOption { id: 1 }, VariantOption { id: 2 } ]
            }

            // Generate SKU jika tidak disediakan
            if (!variantDto.sku) {
              variantDto.sku = this.generateSku(
                `${updateProductDto.name}-${Object.values(variantDto.variantOptions).join('-')}`,
              );
            } else {
              const existingVariant = await transactionalEntityManager.findOne(
                ProductVariant,
                {
                  where: { sku: variantDto.sku },
                },
              );

              if (existingVariant) {
                throw new ConflictException(
                  `SKU for variant ${variantDto.sku} already exists`,
                );
              }
            }

            console.log('debug', variantOptions);
            // Gabungkan nama variant menjadi format yang diinginkan
            const variantNamesString = variantOptions
              .map((vo) => vo.variantName.name)
              .join(', ');

            // Buat varian produk
            const productVariant = new ProductVariant();
            productVariant.product = updatedProduct;
            productVariant.sku = variantDto.sku;
            productVariant.price = variantDto.price;
            productVariant.stock = variantDto.stock;
            productVariant.store = updatedProduct.store;
            productVariant.name = `${updatedProduct.name} - (${variantNamesString})`;

            // Simpan gambar varian (jika ada) - Many-to-Many
            if (variantDto.imageIds && variantDto.imageIds.length > 0) {
              const images = await transactionalEntityManager.findBy(Image, {
                id: In(variantDto.imageIds),
              });

              if (images.length !== variantDto.imageIds.length) {
                throw new NotFoundException('Some variant images not found'); // Tangani jika ada ID yang tidak valid
              }

              productVariant.images = images;
            }

            const savedVariant = await transactionalEntityManager.save(
              ProductVariant,
              productVariant,
            );
            productVariants.push(savedVariant);

            // Simpan ProductVariantOptions untuk menghubungkan variant dengan productVariant
            for (const variantOption of variantOptions) {
              const productVariantOption = new ProductVariantOptions();
              productVariantOption.productVariant = savedVariant;
              productVariantOption.variantOption =
                variantOption as VariantOption;

              await transactionalEntityManager.save(
                ProductVariantOptions,
                productVariantOption,
              );
            }
          }
        }

        // ====== RETURN TO THE USER =========
        updatedProduct.variants = productVariants;

        // Sanitize: Avoid circular references before returning
        updatedProduct.variants.forEach((variant) => {
          variant.product = undefined; // Remove the circular reference
        });
        return updatedProduct;
      },
    );
  }

  @HandleErrors()
  async remove(id: number): Promise<void> {
    await this.productRepository.manager.transaction(async (manager) => {
      const product = await manager.findOne(Product, {
        where: { id },
        relations: ['productImages', 'productImages.image'], // Load images agar bisa dihapus
      });

      if (!product) throw new NotFoundException('Product not found');

      // Hapus hanya gambar terkait
      const imageIds = product.productImages.map((pi) => pi.image.id);
      if (imageIds.length > 0) {
        await manager.delete(Image, imageIds);
      }

      // Hapus produk
      await manager.delete(Product, id);
    });
  }

  @HandleErrors()
  async getProductDetail(productId: number) {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: [
        'store',
        'categories',
        'variants',
        'variants.options',
        'variants.images',
        'variants.options.variantOption',
        'variants.options.variantOption.variantName',
        'variants.options.variantOption.variantName.variantType',
        'productImages.image', // Ambil relasi gambar melalui pivot productImages
      ],
    });

    console.log('debux', product);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      stock: product.stock,
      price: product.price,
      store: {
        id: product.store.id,
        name: product.store.name,
      },
      categories: product.categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
      images: product.productImages
        .sort((a, b) => a.order - b.order) // Urutkan berdasarkan field order
        .map((productImage) => ({
          id: productImage.image.id,
          url: productImage.image.url,
          name: productImage.image.key,
          type: productImage.image.mimeType,
          size: productImage.image.size,
        })),
      variants: product.variants.map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock,
        name: variant.name,
        image: variant.images.map((image) => ({
          url: image.url,
          name: image.key,
          type: image.mimeType,
          size: image.size,
          id: image.id,
        })),

        variantOptions: variant.options.map((option) => ({
          id: option.id,
          name: option.variantOption.variantName.name,
          type: option.variantOption.variantName.variantType.name,
          nameId: option.variantOption.variantName.id,
          typeId: option.variantOption.variantName.variantType.id,
        })),
      })),
      variantTypeSelections: [
        ...product.variants
          .flatMap((variant) =>
            variant.options.map((option) => ({
              id: option.variantOption.variantName.variantType.id,
              variantName: option.variantOption.variantName.name,
            })),
          )
          .reduce((map, { id, variantName }) => {
            if (!map.has(id)) {
              map.set(id, { id, variantName: [] });
            }
            const entry = map.get(id)!;
            if (!entry.variantName.includes(variantName)) {
              entry.variantName.push(variantName);
            }
            return map;
          }, new Map())
          .values(),
      ],
    };
  }
}
