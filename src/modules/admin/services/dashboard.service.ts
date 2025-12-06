// src/modules/admin/services/dashboard.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { subDays } from 'date-fns';

export interface DashboardStats {
  sales: any[];
  topProducts: any[];
  categoryStats: any[];
  userStats: any;
  summary: { totalRevenue: number; totalOrders: number; avgOrderValue: number };
}

@Injectable()
export class DashboardService {
  constructor(
    private dataSource: DataSource,
  ) { }

  async getStats(timeRange: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<DashboardStats> {
    const days = this.getDaysFromRange(timeRange);
    const startDate = subDays(new Date(), days);

    // Sales statistics
    const salesStats = await this.dataSource
      .createQueryBuilder()
      .select("DATE_TRUNC('day', created_at)", 'date')
      .addSelect('SUM(total_amount)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .addSelect('AVG(total_amount)', 'avgOrderValue')
      .from('orders', 'orders')
      .where('created_at >= :startDate', { startDate })
      .andWhere('status != :status', { status: 'cancelled' })
      .groupBy("DATE_TRUNC('day', created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();

    // Top products
    const topProducts = await this.dataSource
      .createQueryBuilder()
      .select('product_name', 'name')
      .addSelect('SUM(quantity)', 'unitsSold')
      .addSelect('SUM(total_price)', 'revenue')
      .from('order_items', 'items')
      .innerJoin('orders', 'orders', 'orders.id = items.order_id')
      .where('orders.created_at >= :startDate', { startDate })
      .groupBy('product_name')
      .orderBy('revenue', 'DESC')
      .limit(10)
      .getRawMany();

    // Category performance
    const categoryStats = await this.dataSource
      .createQueryBuilder()
      .select('categories.name', 'category')
      .addSelect('COUNT(orders.id)', 'orderCount')
      .addSelect('SUM(orders.total_amount)', 'revenue')
      .from('orders', 'orders')
      .innerJoin('order_items', 'items', 'items.order_id = orders.id')
      .innerJoin('products', 'products', 'products.id = items.product_id')
      .innerJoin('categories', 'categories', 'categories.id = products.category_id')
      .where('orders.created_at >= :startDate', { startDate })
      .groupBy('categories.name')
      .orderBy('revenue', 'DESC')
      .getRawMany();

    // User analytics
    const userStats = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(DISTINCT user_id)', 'totalCustomers')
      .addSelect('COUNT(CASE WHEN created_at >= :recent THEN 1 END)', 'newCustomers')
      .from('orders', 'orders')
      .where('created_at >= :startDate', { startDate })
      .setParameters({ startDate, recent: subDays(new Date(), 7) })
      .getRawOne();

    return {
      sales: salesStats,
      topProducts,
      categoryStats,
      userStats,
      summary: {
        totalRevenue: salesStats.reduce((sum, day) => sum + parseFloat(day.revenue), 0),
        totalOrders: salesStats.reduce((sum, day) => sum + parseInt(day.orders), 0),
        avgOrderValue: salesStats.reduce((sum, day) => sum + parseFloat(day.avgordervalue), 0) / salesStats.length,
      },
    };
  }

  private getDaysFromRange(range: string): number {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }
}