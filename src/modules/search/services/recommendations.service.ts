import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Product } from '@modules/products/entities/product.entity';
import { User } from '@modules/auth/entities/user.entity';
import { Order } from '@modules/orders/entities/order.entity';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  /**
   * Collaborative Filtering: "Customers who bought this also bought"
   */
  async getFrequentlyBoughtTogether(productId: string, limit = 5): Promise<Product[]> {
    const frequentlyBought = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('order.items', 'relatedItem')
      .where('item.productId = :productId', { productId })
      .andWhere('relatedItem.productId != :productId', { productId })
      .select('relatedItem.productId', 'productId')
      .addSelect('COUNT(*)', 'frequency')
      .groupBy('relatedItem.productId')
      .orderBy('frequency', 'DESC')
      .limit(limit)
      .getRawMany();

    const productIds = frequentlyBought.map(f => f.productId);
    return this.productRepository.findByIds(productIds);
  }

  /**
   * Content-based: Similar products by category and tags
   */
  async getSimilarProducts(productId: string, limit = 8): Promise<Product[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['category', 'brand'],
    });

    if (!product) return [];

    return this.productRepository
      .createQueryBuilder('product')
      .where('product.id != :productId', { productId })
      .andWhere('product.isActive = true')
      .andWhere(
        new Brackets(qb => {
          qb.where('product.categoryId = :categoryId', { categoryId: product.categoryId })
            .orWhere('product.brandId = :brandId', { brandId: product.brandId });
        }),
      )
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();
  }

  /**
   * Personalized: Based on user's purchase/view history
   */
  async getPersonalizedRecommendations(userId: string, limit = 10): Promise<Product[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['orders', 'orders.items', 'wishlist'],
    });

    if (!user) return [];

    // Get categories from user's purchases and wishlist
    const categoryIds = [
      ...user.orders.flatMap(order => order.items.map(item => item.product.categoryId)),
      ...user.wishlist.map(item => item.product.categoryId),
    ];

    // Remove duplicates and get top categories
    const topCategoryIds = Object.entries(
      categoryIds.reduce((acc, catId) => ({ ...acc, [catId]: (acc[catId] || 0) + 1 }), {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    return this.productRepository
      .createQueryBuilder('product')
      .where('product.categoryId IN (:...categoryIds)', { categoryIds })
      .andWhere('product.isActive = true')
      .orderBy('product.metadata->>"avgRating"', 'DESC')
      .limit(limit)
      .getMany();
  }
}