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
    async findAll(@Query() pagination: PaginationDto) {
        return this.usersService.findAll(pagination);
    }

    /**
     * Get current user profile
     */
    @Get('me')
    async getCurrentUser(@Request() req) {
        return this.usersService.findOne(req.user.id);
    }

    /**
     * Update current user profile
     */
    @Patch('me')
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
    async remove(@Param('id') id: string) {
        await this.usersService.remove(id);
    }
}
