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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { CreateAuditLogDto } from '../dtos/audit-log.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Analytics Controller
 * Manages audit logs and analytics data for admin users
 */
@ApiTags('Admin Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    /**
     * Get audit logs
     */
    @Get('audit-logs')
    @ApiOperation({ summary: 'Get audit logs', description: 'Retrieve system audit logs' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
    async getAuditLogs(@Query('limit') limit?: number) {
        return this.analyticsService.getAuditLogs(limit);
    }

    /**
     * Create audit log entry
     */
    @Post('audit-logs')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create audit log', description: 'Manually create an audit log entry' })
    @ApiBody({ type: CreateAuditLogDto })
    @ApiResponse({ status: 201, description: 'Audit log created' })
    async createAuditLog(@Body() createAuditLogDto: CreateAuditLogDto) {
        return this.analyticsService.logAction(createAuditLogDto);
    }

    /**
     * Get dashboard statistics
     */
    @Get('dashboard-stats')
    @ApiOperation({ summary: 'Get dashboard stats', description: 'Retrieve key performance indicators' })
    @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
    async getDashboardStats() {
        return this.analyticsService.getDashboardStats();
    }
}
