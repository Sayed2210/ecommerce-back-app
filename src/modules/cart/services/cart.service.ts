import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { AddCartItemDto } from '../dto/add-cart-item.dto';
import { ProductRepository } from '@modules/products/repositories/product.repository';
import { RedisService } from '@common/services/redis.service';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
        private productRepository: ProductRepository,
        private redisService: RedisService,
    ) { }


    async getOrCreateCart(userId?: string, sessionId?: string): Promise<Cart> {
        let cart: Cart;

        if (userId) {
            cart = await this.cartRepository.findOne({
                where: { user: { id: userId } },
                relations: ['items', 'items.product', 'items.variant'],
            });

            if (!cart) {
                cart = this.cartRepository.create({ user: { id: userId } });
                await this.cartRepository.save(cart);
            }
        } else if (sessionId) {
            // Guest cart stored in Redis for performance
            const cachedCart = await this.redisService.get(`cart:${sessionId}`);
            if (cachedCart) {
                return JSON.parse(cachedCart);
            }

            cart = this.cartRepository.create({ sessionId });
            await this.cartRepository.save(cart);
        }

        return cart;
    }

    async addItem(cartId: string, itemDto: AddCartItemDto): Promise<Cart> {
        const cart = await this.cartRepository.findOne({
            where: { id: cartId },
            relations: ['items'],
        });

        if (!cart) throw new NotFoundException('Cart not found');

        // Check stock availability
        const variant = await this.productRepository.getVariant(itemDto.variantId);
        if (!variant || variant.inventoryQuantity < itemDto.quantity) {
            throw new BadRequestException('Insufficient stock');
        }

        // Check if item exists
        const existingItem = cart.items.find(
            item => item.productId === itemDto.productId && item.variantId === itemDto.variantId,
        );

        if (existingItem) {
            existingItem.quantity += itemDto.quantity;
            await this.cartItemRepository.save(existingItem);
        } else {
            const newItem = this.cartItemRepository.create({
                cart,
                ...itemDto,
            });
            await this.cartItemRepository.save(newItem);
        }

        return this.getCartWithTotals(cartId);
    }

    private async getCartWithTotals(cartId: string): Promise<Cart> {
        const cart = await this.cartRepository.findOne({
            where: { id: cartId },
            relations: ['items', 'items.product', 'items.variant'],
        });

        // Calculate totals
        cart.items = cart.items.map(item => ({
            ...item,
            totalPrice: (item.product.basePrice + item.variant.priceModifier) * item.quantity,
        }));

        cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        return cart;
    }
}