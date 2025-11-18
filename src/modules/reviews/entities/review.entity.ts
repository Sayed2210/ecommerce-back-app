// src/modules/reviews/entities/review.entity.ts
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';
import { Product } from '@modules/products/entities/product.entity';
import { Order } from '@modules/orders/entities/order.entity';
import { ReviewImage } from './review-image.entity';

@Entity('reviews')
export class Review extends BaseEntity {
    @Column()
    rating: number;

    @Column({ nullable: true, length: 255 })
    title?: string;

    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column('text', { array: true, default: [] })
    images: string[];

    @Column({ name: 'is_verified_purchase', default: false })
    isVerifiedPurchase: boolean;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => User, user => user.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Product, product => product.reviews, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: 'order_id' })
    order?: Order;

    @OneToMany(() => ReviewImage, image => image.review, { cascade: true })
    reviewImages: ReviewImage[];
}