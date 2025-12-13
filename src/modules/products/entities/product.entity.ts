// src/modules/products/entities/product.entity.ts
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Category } from './category.entity';
import { Brand } from './brand.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { CartItem } from '@modules/cart/entities/cart-item.entity';
import { OrderItem } from '@modules/orders/entities/order-item.entity';
import { Review } from '@modules/reviews/entities/review.entity';
import { Wishlist } from '@modules/users/entities/wishlist.entity';
import { InventoryLog } from './inventory-log.entity';
@Entity('products')
@Index(['slug', 'isActive', 'publishedAt'])
export class Product extends BaseEntity {
    @Column({ type: 'jsonb' })
    @Index({ unique: false }) // Indexing jsonb might require specific strategy, keeping simple for now or removing if not needed for exact match
    name: Record<string, any>;

    @Column({ length: 500, unique: true })
    slug: string;

    @Column({ type: 'jsonb', nullable: true })
    description?: Record<string, any>;

    @Column({ name: 'short_description', type: 'jsonb', nullable: true })
    shortDescription?: Record<string, any>;

    @ManyToOne(() => Brand, brand => brand.products, { nullable: true })
    @JoinColumn({ name: 'brand_id' })
    brand?: Brand;

    @ManyToOne(() => Category, category => category.products)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ name: 'base_price', type: 'decimal', precision: 12, scale: 2 })
    basePrice: number;

    @Column({ name: 'compare_at_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
    compareAtPrice?: number;

    @Column({ name: 'cost_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
    costPrice?: number;

    @Column({ nullable: true, length: 100 })
    sku?: string;

    @Column({ nullable: true, length: 100 })
    barcode?: string;

    @Column({ name: 'track_inventory', default: true })
    trackInventory: boolean;

    @Column({ name: 'inventory_quantity', default: 0 })
    inventoryQuantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    weight?: number;

    @Column({ type: 'jsonb', nullable: true })
    dimensions?: Record<string, any>;

    @Column({ name: 'seo_title', type: 'jsonb', nullable: true })
    seoTitle?: Record<string, any>;

    @Column({ name: 'seo_description', type: 'jsonb', nullable: true })
    seoDescription?: Record<string, any>;

    @Column({ name: 'seo_keywords', type: 'jsonb', nullable: true })
    seoKeywords?: Record<string, any>;

    @Column({ name: 'is_featured', default: false })
    isFeatured: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'published_at', type: 'timestamptz', default: () => 'NOW()' })
    publishedAt: Date;

    @Column({ type: 'jsonb', default: {} })
    metadata: Record<string, any>;

    // Relationships
    @OneToMany(() => ProductVariant, variant => variant.product, { cascade: true })
    variants: ProductVariant[];

    @OneToMany(() => ProductImage, image => image.product, { cascade: true })
    images: ProductImage[];

    @OneToMany(() => CartItem, item => item.product)
    cartItems: CartItem[];

    @OneToMany(() => OrderItem, item => item.product)
    orderItems: OrderItem[];

    @OneToMany(() => Review, review => review.product)
    reviews: Review[];

    @OneToMany(() => Wishlist, wishlist => wishlist.product)
    wishlist: Wishlist[];

    @OneToMany(() => InventoryLog, log => log.product)
    inventoryLogs: InventoryLog[];
}