import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

/**
 * Users Controller
 * Manages user profiles, accounts, and user-related operations
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Get all users (Admin only)
     */
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all users', description: 'Get all users (Admin only)' })
    @ApiResponse({ status: 200, description: 'Users retrieved' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async findAll(@Query() pagination: PaginationDto) {
        return this.usersService.findAll(pagination);
    }

    /**
     * Get current user profile
     */
    @Get('me')
    @ApiOperation({ summary: 'Get current user', description: 'Get authenticated user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved' })
    async getCurrentUser(@Request() req) {
        return this.usersService.findOne(req.user.id);
    }

    /**
     * Update current user profile
     */
    @Patch('me')
    @ApiOperation({ summary: 'Update profile', description: 'Update current user profile' })
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    async updateProfile(
        @Request() req,
        @Body() updateProfileDto: UpdateProfileDto
    ) {
        return this.usersService.update(req.user.id, updateProfileDto);
    }

    /**
     * Get current user's wishlist
     */
    @Get('me/wishlist')
    @ApiOperation({ summary: 'Get wishlist', description: 'Get current user wishlist' })
    @ApiResponse({ status: 200, description: 'Wishlist retrieved' })
    async getWishlist(@Request() req) {
        return this.usersService.getWishlist(req.user.id);
    }

    /**
     * Get user by ID (Admin only or self? Usually admin can view anyone, user can view self. Keeping simple for now, probably admin only if generic ID)
     * To be safe, let's make it Admin only for explicit ID access, since 'me' covers self.
     */
    @Get(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get user by ID', description: 'Get user details by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    /**
     * Delete user account (Admin only)
     */
    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete user', description: 'Delete user account (Admin only)' })
    @ApiParam({ name: 'id', description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 204, description: 'User deleted' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async remove(@Param('id') id: string) {
        await this.usersService.remove(id);
    }
}
