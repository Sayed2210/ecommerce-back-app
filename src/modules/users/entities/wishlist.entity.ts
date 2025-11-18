// src/modules/users/entities/wishlist.entity.ts
import { Entity, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';
import { Product } from '@modules/products/entities/product.entity';

@Entity('wishlists')
@Unique(['user', 'product'])
export class Wishlist extends BaseEntity {
    @ManyToOne(() => User, user => user.wishlist, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Product, product => product.wishlist, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;
}