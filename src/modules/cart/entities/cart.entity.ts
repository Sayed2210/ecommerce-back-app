// src/modules/cart/entities/cart.entity.ts
import { Entity, Column, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart extends BaseEntity {
    @Column({ name: 'session_id', nullable: true, unique: true })
    sessionId?: string;

    @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
    expiresAt?: Date;

    @OneToOne(() => User, user => user.cart, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @OneToMany(() => CartItem, item => item.cart, { cascade: true })
    items: CartItem[];
}