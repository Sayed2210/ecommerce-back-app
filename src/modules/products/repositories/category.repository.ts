import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryRepository extends AbstractRepository<Category> {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) {
        super(categoryRepository);
    }
}