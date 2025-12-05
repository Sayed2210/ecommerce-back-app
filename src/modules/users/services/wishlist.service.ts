import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { Product } from '../../products/entities/product.entity';

@Injectable()
export class WishlistService {
    constructor(
        @InjectRepository(Wishlist)
        private readonly wishlistRepository: Repository<Wishlist>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
    ) { }

    async findAll(userId: string) {
        return this.wishlistRepository.find({
            where: { user: { id: userId } },
            relations: ['product', 'product.images', 'product.brand'],
            order: { createdAt: 'DESC' },
        });
    }

    async addItem(userId: string, productId: string) {
        const existing = await this.wishlistRepository.findOne({
            where: { user: { id: userId }, product: { id: productId } },
        });

        if (existing) {
            throw new ConflictException('Product already in wishlist');
        }

        const product = await this.productRepository.findOne({ where: { id: productId } });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.wishlistRepository.save({
            user: { id: userId },
            product: { id: productId },
        });
    }

    async removeItem(userId: string, productId: string) {
        const item = await this.wishlistRepository.findOne({
            where: { user: { id: userId }, product: { id: productId } },
        });

        if (!item) {
            throw new NotFoundException('Wishlist item not found');
        }

        return this.wishlistRepository.remove(item);
    }

    async clearWishlist(userId: string) {
        return this.wishlistRepository.delete({ user: { id: userId } });
    }
}