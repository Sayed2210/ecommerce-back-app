import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/notification.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post()
    @ApiOperation({ summary: 'Create notification', description: 'Create a new notification' })
    @ApiBody({ type: CreateNotificationDto })
    @ApiResponse({ status: 201, description: 'Notification created' })
    create(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationService.create(createNotificationDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all notifications', description: 'Retrieve user notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved' })
    findAll(@Request() req, @Query() pagination: PaginationDto) {
        return this.notificationService.findAll(req.user.id, pagination);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark as read', description: 'Mark a notification as read' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'Notification updated' })
    markAsRead(@Param('id') id: string) {
        return this.notificationService.markAsRead(id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Mark all as read', description: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    markAllAsRead(@Request() req) {
        return this.notificationService.markAllAsRead(req.user.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification', description: 'Delete a notification' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'Notification deleted' })
    remove(@Param('id') id: string) {
        return this.notificationService.remove(id);
    }
}
