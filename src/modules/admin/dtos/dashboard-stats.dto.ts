import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
    @ApiProperty({ description: 'Total number of orders' })
    totalOrders: number;

    @ApiProperty({ description: 'Total revenue amount' })
    totalRevenue: number;

    @ApiProperty({ description: 'Total number of users' })
    totalUsers: number;

    @ApiProperty({ description: 'Total number of products' })
    totalProducts: number;

    @ApiProperty({ description: 'List of recent orders' })
    recentOrders: any[];
}
