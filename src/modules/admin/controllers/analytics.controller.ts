import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { AnalyticsService } from '../services/analytics.service';
import { CreateAuditLogDto } from '../dtos/audit-log.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Analytics Controller
 * Manages audit logs and analytics data for admin users
 */
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * Get audit logs
     */
    @Get('audit-logs')
    async getAuditLogs(@Query('limit') limit?: number) {
        return this.analyticsService.getAuditLogs(limit);
    }

    /**
     * Create audit log entry
     */
    @Post('audit-logs')
    @HttpCode(HttpStatus.CREATED)
    async createAuditLog(@Body() createAuditLogDto: CreateAuditLogDto) {
        return this.analyticsService.logAction(createAuditLogDto);
    }

    /**
     * Get dashboard statistics
     */
    @Get('dashboard-stats')
    async getDashboardStats() {
        return this.analyticsService.getDashboardStats();
    }
}
