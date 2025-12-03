import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class VariantsService {
    constructor(
        @InjectRepository(ProductVariant)
        private readonly variantRepository: Repository<ProductVariant>,
    ) { }

    async create(productId: string, variantData: Partial<ProductVariant>) {
        const existing = await this.variantRepository.findOne({
            where: {
                product: { id: productId },
                sku: variantData.sku,
            },
        });
        if (existing) {
            throw new BadRequestException('SKU already exists');
        }

        return this.variantRepository.save({
            ...variantData,
            product: { id: productId },
        });
    }

    async findByProduct(productId: string) {
        return this.variantRepository.find({
            where: { product: { id: productId }, isActive: true },
            relations: ['product'],
        });
    }

    async update(variantId: string, data: Partial<ProductVariant>) {
        const variant = await this.variantRepository.findOne({
            where: { id: variantId },
        });
        if (!variant) throw new NotFoundException('Variant not found');
        return this.variantRepository.update(variantId, data);
    }

    async remove(variantId: string) {
        const variant = await this.variantRepository.findOne({ where: { id: variantId } });
        if (!variant) throw new NotFoundException('Variant not found');
        return this.variantRepository.softDelete(variantId);
    }
}