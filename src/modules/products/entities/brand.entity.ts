// src/modules/products/entities/brand.entity.ts
import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';

@Entity('brands')
export class Brand extends BaseEntity {
    @Column({ unique: true })
    slug: string;

    @Column({ type: 'jsonb', unique: true })
    name: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    description?: Record<string, any>;

    @Column({ name: 'logo_url', nullable: true })
    logoUrl?: string;

    @Column({ name: 'website_url', nullable: true })
    websiteUrl?: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @OneToMany(() => Product, product => product.brand)
    products: Product[];
}