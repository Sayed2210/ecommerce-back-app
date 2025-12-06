import {
    Controller,
    Get,
    UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Dashboard Controller
 * Provides admin dashboard statistics and overview data
 */
@ApiTags('Admin - Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    /**
     * Get dashboard statistics
     */
    @Get('stats')
    @ApiOperation({ summary: 'Get dashboard stats', description: 'Get admin dashboard statistics' })
    @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved' })
    async getStats() {
        return this.dashboardService.getStats();
    }
}
