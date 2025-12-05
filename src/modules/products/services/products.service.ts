import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like, Between } from 'typeorm';
import { ProductRepository } from '../repositories/product.repository';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { FilterDto } from '../dtos/filter.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { SlugUtil } from '../../../common/utils/slug.util';
import { RedisService } from '../../../infrastructure/cache/redis.service';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);

    constructor(
        private readonly productRepository: ProductRepository,
        private readonly cacheService: RedisService,
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) { }

    async create(dto: CreateProductDto) {
        const slug = await SlugUtil.generateUniqueSlug(dto.name, this.productRepo);

        const product = await this.productRepository.create({
            ...dto,
            slug,
            metadata: {
                avgRating: 0,
                reviewCount: 0,
                viewCount: 0,
            },
        });

        await this.cacheService.delete('products:all');
        return product;
    }

    async findAll(filters: FilterDto, pagination: PaginationDto) {
        const cacheKey = `products:${JSON.stringify(filters)}:${JSON.stringify(pagination)}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const { categoryId, brandId, minPrice, maxPrice, search, sortBy } = filters;
        const { page = 1, limit = 20 } = pagination;

        const query = this.productRepo.createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.brand', 'brand')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.isActive = :isActive', { isActive: true });

        if (categoryId) {
            query.andWhere('product.category.id = :categoryId', { categoryId });
        }

        if (brandId) {
            query.andWhere('product.brand.id = :brandId', { brandId });
        }

        if (minPrice || maxPrice) {
            query.andWhere('product.basePrice BETWEEN :minPrice AND :maxPrice', {
                minPrice: minPrice || 0,
                maxPrice: maxPrice || 999999,
            });
        }

        if (search) {
            query.andWhere('(product.name ILIKE :search OR product.description ILIKE :search)', {
                search: `%${search}%`,
            });
        }

        // Apply sorting
        switch (sortBy) {
            case 'price-asc':
                query.orderBy('product.basePrice', 'ASC');
                break;
            case 'price-desc':
                query.orderBy('product.basePrice', 'DESC');
                break;
            case 'rating':
                query.orderBy("product.metadata->>'avgRating'", 'DESC');
                break;
            case 'newest':
            default:
                query.orderBy('product.createdAt', 'DESC');
        }

        const [data, total] = await query
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        const result = { data, total, page, limit };
        await this.cacheService.set(cacheKey, result, 300); // Cache for 5 minutes
        return result;
    }

    async findOne(id: string) {
        const cacheKey = `product:${id}`;
        const cached = await this.cacheService.get(cacheKey);
        if (cached) return cached;

        const product = await this.productRepo.findOne({
            where: { id, isActive: true },
            relations: ['category', 'brand', 'variants', 'images', 'reviews'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Increment view count
        await this.productRepo.update(id, {
            metadata: {
                ...product.metadata,
                viewCount: (product.metadata?.viewCount || 0) + 1,
            },
        });

        await this.cacheService.set(cacheKey, product, 600);
        return product;
    }

    async update(id: string, dto: UpdateProductDto) {
        await this.findOne(id);
        const updated = await this.productRepository.update(id, dto);
        await this.cacheService.delete(`product:${id}`);
        await this.cacheService.delete('products:all');
        return updated;
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.productRepository.update(id, { isActive: false });
        await this.cacheService.delete(`product:${id}`);
        await this.cacheService.delete('products:all');
    }
}