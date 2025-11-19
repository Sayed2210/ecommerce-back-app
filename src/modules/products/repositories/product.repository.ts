import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

export interface ProductFilters {
    categorySlug?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: 'price-low' | 'price-high' | 'newest' | 'popularity';
    page: number;
    limit: number;
}

@Injectable()
export class ProductRepository extends Repository<Product> {
    async findWithFilters(filters: ProductFilters): Promise<[Product[], number]> {
        const query = this.createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.brand', 'brand')
            .leftJoinAndSelect('product.variants', 'variants')
            .leftJoinAndSelect('product.images', 'images')
            .where('product.isActive = true');

        // Index-backed filters
        if (filters.categorySlug) {
            query.andWhere('category.slug = :slug', { slug: filters.categorySlug });
        }

        if (filters.brandId) {
            query.andWhere('product.brandId = :brandId', { brandId: filters.brandId });
        }

        if (filters.minPrice || filters.maxPrice) {
            query.andWhere('product.basePrice BETWEEN :min AND :max', {
                min: filters.minPrice || 0,
                max: filters.maxPrice || 999999,
            });
        }

        // Full-text search with index
        if (filters.search) {
            query.andWhere('product.search_vector @@ plainto_tsquery(:search)', {
                search: filters.search,
            });
        }

        // Sort
        switch (filters.sortBy) {
            case 'price-low':
                query.orderBy('product.basePrice', 'ASC');
                break;
            case 'price-high':
                query.orderBy('product.basePrice', 'DESC');
                break;
            case 'newest':
                query.orderBy('product.createdAt', 'DESC');
                break;
            case 'popularity':
                query.orderBy('product.metadata->>"views"', 'DESC');
                break;
            default:
                query.orderBy('product.publishedAt', 'DESC');
        }

        // Pagination
        const [products, total] = await query
            .skip((filters.page - 1) * filters.limit)
            .take(filters.limit)
            .getManyAndCount();

        return [products, total];
    }
}