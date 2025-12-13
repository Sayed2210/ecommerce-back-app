import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { AddCartItemDto } from '../dtos/add-cart-item.dto';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { ProductRepository } from '../../products/repositories/product.repository';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { RedisService } from '../../../infrastructure/cache/redis.service';
import { NotificationsGateway } from '../../notifications/services/websocket.gateway';

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private cartRepository: Repository<Cart>,
        @InjectRepository(CartItem)
        private cartItemRepository: Repository<CartItem>,
        @InjectRepository(ProductVariant)
        private productVariantRepository: Repository<ProductVariant>,
        private readonly productRepository: ProductRepository,
        private readonly redisService: RedisService,
        private readonly notificationsGateway: NotificationsGateway,
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
            // Guest cart stored in Redis for performance (simplified: just retrieval check)
            // Implementation logic suggests redis usage, but saving to DB eventually?
            // Existing code saved to DB.
            cart = await this.cartRepository.findOne({ where: { sessionId } });
            if (!cart) {
                cart = this.cartRepository.create({ sessionId });
                await this.cartRepository.save(cart);
            }
        }

        return this.getCartWithTotals(cart.id);
    }

    async addItem(cartId: string, itemDto: AddCartItemDto): Promise<Cart> {
        const cart = await this.cartRepository.findOne({
            where: { id: cartId },
            relations: ['items', 'items.product', 'items.variant'],
        });

        if (!cart) throw new NotFoundException('Cart not found');

        // Check stock availability
        let priceModifier = 0;

        if (itemDto.variantId) {
            const variant = await this.productVariantRepository.findOne({ where: { id: itemDto.variantId } });
            if (!variant || variant.inventoryQuantity < itemDto.quantity) {
                throw new BadRequestException('Insufficient stock for variant');
            }
            priceModifier = variant.priceModifier;
        } else {
            // Check product stock if needed (omitted in original but good to have)
            // Assuming product existence check is done via relations or database constraints
        }

        // Check if item exists
        const existingItem = cart.items.find(
            item => item.product.id === itemDto.productId && item.variant?.id === itemDto.variantId,
        );

        if (existingItem) {
            existingItem.quantity += itemDto.quantity;
            await this.cartItemRepository.save(existingItem);
        } else {
            const newItem = this.cartItemRepository.create({
                cart,
                product: { id: itemDto.productId } as any,
                variant: itemDto.variantId ? { id: itemDto.variantId } as any : null,
                quantity: itemDto.quantity,
            });
            await this.cartItemRepository.save(newItem);
        }

        const updatedCart = await this.getCartWithTotals(cartId);

        // Notify user if authenticated
        // Assuming we can get userId from cart or passing it. Cart has user relation.
        if (updatedCart.user?.id) {
            this.notificationsGateway.sendCartUpdate(updatedCart.user.id, updatedCart);
        }

        return updatedCart;
    }

    async updateItem(id: string, dto: UpdateCartItemDto) {
        const item = await this.cartItemRepository.findOne({ where: { id }, relations: ['cart'] });
        if (!item) throw new NotFoundException('Item not found');

        item.quantity = dto.quantity;
        await this.cartItemRepository.save(item);

        const updatedCart = await this.getCartWithTotals(item.cart.id);

        if (updatedCart.user?.id) {
            this.notificationsGateway.sendCartUpdate(updatedCart.user.id, updatedCart);
        }

        return updatedCart;
    }

    async removeItem(id: string) {
        const item = await this.cartItemRepository.findOne({ where: { id }, relations: ['cart', 'cart.user'] });
        if (!item) return; // or throw

        const cartId = item.cart.id;
        const userId = item.cart.user?.id;

        await this.cartItemRepository.delete(id);

        if (userId) {
            const updatedCart = await this.getCartWithTotals(cartId);
            this.notificationsGateway.sendCartUpdate(userId, updatedCart);
        }
    }

    async clearCart(cartId: string) {
        // We need userId before deleting
        const cart = await this.cartRepository.findOne({ where: { id: cartId }, relations: ['user'] });
        if (!cart) return;

        await this.cartItemRepository.delete({ cart: { id: cartId } });

        if (cart.user?.id) {
            this.notificationsGateway.sendCartUpdate(cart.user.id, { ...cart, items: [], subtotal: 0 });
        }
    }

    private async getCartWithTotals(cartId: string): Promise<Cart> {
        const cart = await this.cartRepository.findOne({
            where: { id: cartId },
            relations: ['items', 'items.product', 'items.variant'],
        });

        if (!cart) return null;

        // Calculate totals
        cart.items = cart.items.map(item => {
            const basePrice = Number(item.product.basePrice);
            const modifier = item.variant ? Number(item.variant.priceModifier) : 0;
            item.totalPrice = (basePrice + modifier) * item.quantity;
            return item;
        });

        cart.subtotal = cart.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

        return cart;
    }
}