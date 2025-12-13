// src/modules/products/entities/category.entity.ts
import { Entity, Column, Tree, TreeChildren, TreeParent, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Product } from './product.entity';

@Entity('categories')
@Tree('closure-table')
export class Category extends BaseEntity {
    @Column({ unique: true })
    slug: string;

    @Column({ type: 'jsonb' })
    name: Record<string, any>;

    @Column({ type: 'jsonb', nullable: true })
    description?: Record<string, any>;

    @Column({ name: 'image_url', nullable: true })
    imageUrl?: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'display_order', default: 0 })
    displayOrder: number;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    // Tree relations
    @TreeParent()
    parent: Category | null;

    @TreeChildren()
    children: Category[];

    // Product relation
    @OneToMany(() => Product, product => product.category)
    products: Product[];
}