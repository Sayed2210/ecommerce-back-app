import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../entities/brand.entity';
import { BrandDto } from '../dtos/brand.dto';
import { SlugUtil } from '../../../common/utils/slug.util';

@Injectable()
export class BrandsService {
    constructor(
        @InjectRepository(Brand)
        private readonly brandRepository: Repository<Brand>,
    ) { }

    async create(dto: BrandDto) {
        const existing = await this.brandRepository.findOne({ where: { name: dto.name as any } });
        if (existing) {
            throw new ConflictException('Brand already exists');
        }

        const slug = await SlugUtil.generateUniqueSlug(dto.name.en, this.brandRepository);
        return this.brandRepository.save({ ...dto, slug });
    }

    async findAll() {
        return this.brandRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });
    }

    async findOne(id: string) {
        const brand = await this.brandRepository.findOne({ where: { id } });
        if (!brand) throw new NotFoundException('Brand not found');
        return brand;
    }

    async update(id: string, dto: BrandDto) {
        await this.findOne(id);
        return this.brandRepository.update(id, dto as any);
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.brandRepository.softDelete(id);
    }
}