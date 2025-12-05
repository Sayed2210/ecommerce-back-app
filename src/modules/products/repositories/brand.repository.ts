import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Brand } from '../entities/brand.entity';

@Injectable()
export class BrandRepository extends AbstractRepository<Brand> {
    constructor(
        @InjectRepository(Brand)
        private readonly brandRepository: Repository<Brand>,
    ) {
        super(brandRepository);
    }

    // Custom methods specific to Brand can be added here
}