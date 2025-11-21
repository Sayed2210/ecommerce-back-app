import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}