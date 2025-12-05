// src/modules/cart/entities/cart-item.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { Cart } from './cart.entity';
import { Product } from '@modules/products/entities/product.entity';
import { ProductVariant } from '@modules/products/entities/product-variant.entity';

@Entity('cart_items')
export class CartItem extends BaseEntity {
    @Column()
    quantity: number;

    @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;

    @ManyToOne(() => Product, product => product.cartItems, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => ProductVariant, variant => variant.cartItems, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'variant_id' })
    variant?: ProductVariant;

    totalPrice?: number;
}