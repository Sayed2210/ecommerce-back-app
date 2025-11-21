import { Injectable } from '@nestjs/common';
import { ProductRepository } from '@modules/products/repositories/product.repository';
import { UserRepository } from '@modules/auth/repositories/user.repository';
import { OrderRepository } from '@modules/orders/repositories/order.repository';
import { Product } from '@/modules/products/entities';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) { }

  async getFrequentlyBoughtTogether(productId: string, limit = 5): Promise<Product[]> {
    const frequentlyBought = await this.orderRepository.getFrequentlyBoughtTogether(productId, limit);
    const productIds = frequentlyBought.map(f => f.productId);
    return this.productRepository.findByIds(productIds);
  }

  async getSimilarProducts(productId: string, limit = 8): Promise<Product[]> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['category', 'brand'],
    });

    if (!product) return [];

    return this.productRepository.findSimilarProducts(productId, product.category.id, product.brand.id, limit);
  }

  async getPersonalizedRecommendations(userId: string, limit = 10): Promise<Product[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['orders', 'orders.items', 'wishlist'],
    });

    if (!user) return [];

    const categoryIds = [
      ...user.orders.flatMap(order => order.items.map(item => item.product.category.id)),
      ...user.wishlist.map(item => item.product.category.id),
    ];

    const topCategoryIds = Object.entries(
      categoryIds.reduce((acc, catId) => ({ ...acc, [catId]: (acc[catId] || 0) + 1 }), {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);

    return this.productRepository.findByCategoriesWithRating(topCategoryIds, limit);
  }
}