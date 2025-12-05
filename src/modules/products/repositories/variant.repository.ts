import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { ProductVariant } from '../entities/product-variant.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductVariantRepository extends AbstractRepository<ProductVariant> {
    constructor(
        @InjectRepository(ProductVariant)
        private readonly variantRepository: Repository<ProductVariant>,
    ) {
        super(variantRepository);
    }

}