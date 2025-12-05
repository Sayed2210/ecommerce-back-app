import {
    Controller,
    Get,
    UseGuards
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Dashboard Controller
 * Provides admin dashboard statistics and overview data
 */
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    /**
     * Get dashboard statistics
     */
    @Get('stats')
    async getStats() {
        return this.dashboardService.getStats();
    }
}
