import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { CategoryDto } from '../dtos/category.dto';
import { SlugUtil } from '../../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) { }

    async create(dto: CategoryDto) {
        const existing = await this.categoryRepository.findOne({
            where: { name: dto.name as any },
        });
        if (existing) {
            throw new ConflictException('Category already exists');
        }

        const slug = await SlugUtil.generateUniqueSlug(dto.name.en, this.categoryRepository);
        return this.categoryRepository.save({ ...dto, slug });
    }

    async findAll() {
        return this.categoryRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string) {
        const category = await this.categoryRepository.findOne({ where: { id } });
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async update(id: string, dto: CategoryDto) {
        const category = await this.findOne(id);
        const updated = this.categoryRepository.merge(category, dto);
        return this.categoryRepository.save(updated);
    }

    async remove(id: string) {
        await this.findOne(id);
        // Check if category has products
        const productCount = await this.categoryRepository.count({
            where: { products: { id } },
        });
        if (productCount > 0) {
            throw new ConflictException('Cannot delete category with products');
        }
        return this.categoryRepository.softDelete(id);
    }
}