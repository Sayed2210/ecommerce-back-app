// src/modules/reviews/entities/review-image.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Review } from './review.entity';

@Entity('review_images')
export class ReviewImage extends BaseEntity {
    @Column()
    url: string;

    @Column({ nullable: true })
    altText?: string;

    @ManyToOne(() => Review, review => review.reviewImages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'review_id' })
    review: Review;
}