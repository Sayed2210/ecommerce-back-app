import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Brackets } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends AbstractRepository<Product> {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) {
        super(productRepository);
    }

    // Custom methods specific to Product
    async findBySlug(slug: string): Promise<Product | null> {
        return this.findOne({ slug } as any);
    }

    async findByCategory(categoryId: string): Promise<Product[]> {
        return this.repository.find({
            where: { category: { id: categoryId } },
            relations: ['variants', 'images'],
        });
    }

    async searchByName(name: string): Promise<Product[]> {
        return this.repository
            .createQueryBuilder('product')
            .where('product.name ILIKE :name', { name: `%${name}%` })
            .andWhere('product.deletedAt IS NULL')
            .getMany();
    }


    async findSimilarProducts(productId: string, categoryId: string, brandId: string, limit = 8): Promise<Product[]> {
        return this.createQueryBuilder('product')
            .where('product.id != :productId', { productId })
            .andWhere('product.isActive = true')
            .andWhere(
                new Brackets(qb => {
                    qb.where('product.categoryId = :categoryId', { categoryId })
                        .orWhere('product.brandId = :brandId', { brandId });
                }),
            )
            .orderBy('RANDOM()')
            .limit(limit)
            .getMany();
    }

    async findByIds(productIds: string[]): Promise<Product[]> {
        return this.repository.findBy({ id: In(productIds) });
    }

    async findByCategoriesWithRating(categoryIds: string[], limit: number = 10): Promise<Product[]> {
        return this.createQueryBuilder('product')
            .leftJoinAndSelect('product.reviews', 'review')
            .where('product.categoryId IN (:...categoryIds)', { categoryIds })
            .andWhere('product.isActive = true')
            .addSelect('AVG(review.rating)', 'averageRating')
            .groupBy('product.id')
            .orderBy('averageRating', 'DESC')
            .limit(limit)
            .getMany();
    }
}