// src/modules/products/entities/product-image.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
    @Column()
    url: string;

    @Column({ name: 'alt_text', nullable: true })
    altText?: string;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ name: 'is_primary', default: false })
    isPrimary: boolean;

    @ManyToOne(() => Product, product => product.images, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => ProductVariant, variant => variant.images, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'variant_id' })
    variant?: ProductVariant;
}