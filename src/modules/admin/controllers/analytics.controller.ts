import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
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
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get audit logs
   */
  @Get('audit-logs')
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve system audit logs',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.analyticsService.getAuditLogs(limit);
  }

  /**
   * Get dashboard statistics
   */
  @Get('dashboard-stats')
  @ApiOperation({
    summary: 'Get dashboard stats',
    description: 'Retrieve key performance indicators',
  })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved' })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }
}
