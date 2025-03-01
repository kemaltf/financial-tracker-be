import {
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
    const productImagesUploaded = await this.imageService.uploadMultipleImages(
      productImages,
      user,
      { storeId: createProductDto.storeId },
    );

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
      (id) => id !== undefined,
    );

    // ========= IMAGE VARIANT UPLOAD ============
    const variantImageIdsMap: Record<number, number[]> = {};
    for (const [variantIndex, images] of Object.entries(variantImagesMap)) {
      const uploadedVariantImages =
        await this.imageService.uploadMultipleImages(images, user, {
          storeId: createProductDto.storeId,
        });

      variantImageIdsMap[parseInt(variantIndex, 10)] =
        uploadedVariantImages.map((image) => image.id);
    }
    createProductDto.variants = createProductDto.variants.map(
      (variant, index) => ({
        ...variant,
        imageIds: variantImageIdsMap[index] || [],
      }),
    );

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

        // ======== PRODUCT VARIANT =============
        const productVariants = [];

        if (createProductDto.variants && createProductDto.variants.length > 0) {
          for (const variantDto of createProductDto.variants) {
            // Ambil semua variantType berdasarkan key dari variantOptions
            const variantTypeNames = Object.keys(variantDto.variantOptions);
            const variantTypes = await transactionalEntityManager.findBy(
              VariantType,
              {
                name: In(variantTypeNames),
              },
            );

            if (variantTypes.length !== variantTypeNames.length) {
              throw new NotFoundException('Some VariantType names not found');
            }

            // === Cek dan Buat VariantName & VariantOption jika belum ada ===
            const variantOptions = [];
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
                },
              );

              if (!variantOption) {
                variantOption = new VariantOption();
                variantOption.variantName = variantName;
                variantOption = await transactionalEntityManager.save(
                  VariantOption,
                  variantOption,
                );
              }

              variantOptions.push(variantOption);
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

            // Buat varian produk
            const productVariant = new ProductVariant();
            productVariant.product = savedProduct;
            productVariant.sku = variantDto.sku;
            productVariant.price = variantDto.price;
            productVariant.stock = variantDto.stock;
            productVariant.store = store;

            // Simpan gambar varian (jika ada) - Many-to-Many
            if (variantDto.imageIds && variantDto.imageIds.length > 0) {
              const images = await transactionalEntityManager.findBy(Image, {
                id: In(variantDto.imageIds),
              });

              if (images.length !== variantDto.imageIds.length) {
                throw new Error('Some images not found'); // Tangani jika ada ID yang tidak valid
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
              productVariantOption.variantOption = variantOption;

              await transactionalEntityManager.save(
                ProductVariantOptions,
                productVariantOption,
              );
            }
          }
        }

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

        // Sanitize: Avoid circular references before returning
        savedProduct.variants.forEach((variant) => {
          variant.product = undefined; // Remove the circular reference
        });
        return savedProduct;
      },
    );
  }

  // Method untuk mengambil semua produk
  // async findAllOpt(
  //   page = 1,
  //   limit = 10,
  //   sortBy = 'name',
  //   sortDirection: 'ASC' | 'DESC' = 'ASC',
  //   storeId: number,
  //   filters: Partial<Product> = {},
  // ) {
  //   // Calculate offset
  //   const offset = (page - 1) * limit;

  //   // Check if sortBy is a valid column
  //   const sortableColumns = ['name', 'price', 'stock', 'createdAt'];
  //   if (!sortableColumns.includes(sortBy)) {
  //     throw new BadRequestException(
  //       `Invalid sortBy column. Allowed: ${sortableColumns.join(', ')}`,
  //     );
  //   }

  //   const invalidFilters: string[] = [];
  //   // Filter only valid fields for "where" clause
  //   const allowedFilters = ['name', 'sku'];
  //   const validFilters: Partial<Record<keyof Product, any>> = {};
  //   for (const [key, value] of Object.entries(filters)) {
  //     if (allowedFilters.includes(key) && value !== undefined) {
  //       validFilters[key as keyof Product] = value;
  //     } else {
  //       invalidFilters.push(key);
  //     }
  //   }

  //   if (invalidFilters.length > 0) {
  //     throw new BadRequestException(
  //       `Invalid filter(s): ${invalidFilters.join(', ')}. Allowed filters: ${allowedFilters.join(', ')}`,
  //     );
  //   }

  //   // Build query with relations, filters, sorting, and pagination
  //   const [data, total] = await this.productRepository.findAndCount({
  //     where: { ...validFilters, store: { id: storeId } },
  //     relations: [
  //       'categories',
  //       'store',
  //       'variants',
  //       'images',
  //       'variants.images',
  //     ],
  //     order: { [sortBy]: sortDirection },
  //     take: limit,
  //     skip: offset,
  //   });

  //   const mappedData = data.flatMap((product) => {
  //     if (product.variants.length > 0) {
  //       // Jika punya varian, parent-nya di-disable
  //       return [
  //         {
  //           value: product.id,
  //           label: product.name,
  //           sku: product.sku,
  //           description: product.description,
  //           stock: product.stock,
  //           price: product.price,
  //           image: product.images[0]?.url,
  //           id: product.id,
  //           disabled: true, // Parent-nya disabled
  //         },
  //         ...product.variants.map((variant) => {
  //           console.log(variant);
  //           return {
  //             value: `${product.id}-${variant.id}`, // Kombinasi parentId-variantId
  //             label: `${product.name} - ${variant.variant_value}`,
  //             sku: variant.sku,
  //             description: product.description,
  //             stock: variant.stock,
  //             price: variant.price,
  //             image: variant.images?.[0]?.url || product.images[0]?.url, // Bisa pakai gambar dari parent
  //             id: variant.id,
  //             disabled: variant.stock == 0,
  //           };
  //         }),
  //       ];
  //     }

  //     // Jika tidak punya varian, langsung return produk utama
  //     return {
  //       value: product.id,
  //       label: product.name,
  //       sku: product.sku,
  //       description: product.description,
  //       stock: product.stock,
  //       price: product.price,
  //       image: product.images[0]?.url,
  //       id: product.id,
  //       disabled: product.stock == 0, // Ensure the disabled property is included
  //     };
  //   });

  //   return {
  //     data: mappedData,
  //     total,
  //     currentPage: page,
  //     totalPages: Math.ceil(total / limit),
  //   };
  // }

  // Method untuk mengambil satu produk berdasarkan ID
  async findOne(id: number): Promise<Product> {
    return this.productRepository.findOne({ where: { id } });
  }

  // @HandleErrors()
  // async update(
  //   productId: number,
  //   updateProductDto: UpdateProductDto,
  // ): Promise<Product> {
  //   // Mulai transaksi untuk memastikan konsistensi data
  //   // return await this.productRepository.manager.transaction(
  //   //   async (transactionalEntityManager) => {
  //   //     // 1. Temukan produk yang akan diperbarui
  //   //     const product = await transactionalEntityManager.findOne(Product, {
  //   //       where: { id: productId },
  //   //       relations: ['categories', 'variants', 'images'], // Termasuk relasi yang relevan
  //   //     });
  //   //     if (!product) {
  //   //       throw new NotFoundException('Product not found');
  //   //     }
  //   //     // 2. Perbarui kategori (jika diberikan)
  //   //     if (
  //   //       updateProductDto.categories &&
  //   //       updateProductDto.categories.length > 0
  //   //     ) {
  //   //       const categories = await transactionalEntityManager.findBy(Category, {
  //   //         id: In(updateProductDto.categories),
  //   //       });
  //   //       if (!categories.length) {
  //   //         throw new HttpException(
  //   //           'Some categories not found',
  //   //           HttpStatus.NOT_FOUND,
  //   //         );
  //   //       }
  //   //       product.categories = categories;
  //   //     }
  //   //     // 3. Temukan store berdasarkan ID (jika diperbarui)
  //   //     if (updateProductDto.store) {
  //   //       const store = await transactionalEntityManager.findOne(Store, {
  //   //         where: { id: updateProductDto.store },
  //   //       });
  //   //       if (!store) {
  //   //         throw new NotFoundException('Store not found');
  //   //       }
  //   //       product.store = store;
  //   //     }
  //   //     // 4. Perbarui atribut produk
  //   //     product.name = updateProductDto.name ?? product.name;
  //   //     product.sku = updateProductDto.sku ?? product.sku;
  //   //     product.description =
  //   //       updateProductDto.description ?? product.description;
  //   //     product.stock = updateProductDto.stock ?? product.stock;
  //   //     product.price = updateProductDto.price ?? product.price;
  //   //     // 5. Perbarui gambar produk utama (jika ada)
  //   //     if (updateProductDto.imageIds && updateProductDto.imageIds.length > 0) {
  //   //       const images = await transactionalEntityManager.findBy(Image, {
  //   //         id: In(updateProductDto.imageIds),
  //   //       });
  //   //       if (images.length !== updateProductDto.imageIds.length) {
  //   //         throw new HttpException(
  //   //           'Some product images not found',
  //   //           HttpStatus.NOT_FOUND,
  //   //         );
  //   //       }
  //   //       product.images = images;
  //   //     }
  //   //     // 6. Simpan produk setelah pembaruan
  //   //     const updatedProduct = await transactionalEntityManager.save(
  //   //       Product,
  //   //       product,
  //   //     );
  //   //     // 7. Perbarui varian produk (jika ada)
  //   //     const updatedVariants = [];
  //   //     if (updateProductDto.variants && updateProductDto.variants.length > 0) {
  //   //       for (const variantDto of updateProductDto.variants) {
  //   //         let productVariant: ProductVariant;
  //   //         // Periksa apakah varian ini sudah ada atau perlu dibuat
  //   //         if (variantDto.id) {
  //   //           productVariant = await transactionalEntityManager.findOne(
  //   //             ProductVariant,
  //   //             { where: { id: variantDto.id }, relations: ['images'] },
  //   //           );
  //   //           if (!productVariant) {
  //   //             throw new NotFoundException(
  //   //               `Variant with ID ${variantDto.id} not found`,
  //   //             );
  //   //           }
  //   //         } else {
  //   //           productVariant = new ProductVariant();
  //   //         }
  //   //         // Temukan atau tetapkan jenis varian
  //   //         const variantType = await transactionalEntityManager.findOne(
  //   //           VariantType,
  //   //           { where: { id: variantDto.variantTypeId } },
  //   //         );
  //   //         if (!variantType) {
  //   //           throw new NotFoundException(
  //   //             `VariantType with ID ${variantDto.variantTypeId} not found`,
  //   //           );
  //   //         }
  //   //         productVariant.variantType = variantType;
  //   //         productVariant.variant_value =
  //   //           variantDto.variant_value ?? productVariant.variant_value;
  //   //         productVariant.sku =
  //   //           variantDto.sku ??
  //   //           this.generateSku(`${product.name}_${variantDto.variant_value}`);
  //   //         productVariant.price = variantDto.price ?? productVariant.price;
  //   //         productVariant.stock = variantDto.stock ?? productVariant.stock;
  //   //         productVariant.product = updatedProduct;
  //   //         // Perbarui gambar varian (jika ada)
  //   //         if (variantDto.imageIds && variantDto.imageIds.length > 0) {
  //   //           const images = await transactionalEntityManager.findBy(Image, {
  //   //             id: In(variantDto.imageIds),
  //   //           });
  //   //           if (images.length !== variantDto.imageIds.length) {
  //   //             throw new HttpException(
  //   //               'Some variant images not found',
  //   //               HttpStatus.NOT_FOUND,
  //   //             );
  //   //           }
  //   //           productVariant.images = images;
  //   //         }
  //   //         // Simpan varian
  //   //         const savedVariant = await transactionalEntityManager.save(
  //   //           ProductVariant,
  //   //           productVariant,
  //   //         );
  //   //         updatedVariants.push(savedVariant);
  //   //       }
  //   //     }
  //   //     // Sanitize: Hindari referensi melingkar
  //   //     updatedProduct.variants = updatedVariants;
  //   //     updatedProduct.variants.forEach((variant) => {
  //   //       variant.product = undefined;
  //   //     });
  //   //     // Kembalikan produk yang diperbarui
  //   //     return updatedProduct;
  //   //   },
  //   // );
  // }

  // Method untuk menghapus produk berdasarkan ID
  async remove(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }
}
