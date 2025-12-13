import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { WishlistService } from '../services/wishlist.service';
import { CreateWishlistDto } from '../dtos/wishlist.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Wishlist Controller
 * Manages user's wishlist
 */
@ApiTags('Wishlist')
@ApiBearerAuth()
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    /**
     * Get user's wishlist
     */
    @Get()
    @ApiOperation({ summary: 'Get wishlist', description: 'Retrieve current user\'s wishlist' })
    @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully' })
    async getWishlist(@Request() req) {
        return this.wishlistService.findAll(req.user.id);
    }

    /**
     * Add item to wishlist
     */
    @Post()
    @ApiOperation({ summary: 'Add Item', description: 'Add a product to wishlist' })
    @ApiBody({ type: CreateWishlistDto })
    @ApiResponse({ status: 201, description: 'Item added to wishlist' })
    @ApiResponse({ status: 409, description: 'Product already in wishlist' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async addItem(
        @Request() req,
        @Body() createWishlistDto: CreateWishlistDto
    ) {
        return this.wishlistService.addItem(req.user.id, createWishlistDto.productId);
    }

    /**
     * Remove item from wishlist
     */
    @Delete(':productId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove Item', description: 'Remove a product from wishlist' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiResponse({ status: 204, description: 'Item removed from wishlist' })
    @ApiResponse({ status: 404, description: 'Item not found in wishlist' })
    async removeItem(
        @Request() req,
        @Param('productId') productId: string
    ) {
        await this.wishlistService.removeItem(req.user.id, productId);
    }

    /**
     * Clear wishlist
     */
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Clear Wishlist', description: 'Remove all items from wishlist' })
    @ApiResponse({ status: 204, description: 'Wishlist cleared' })
    async clearWishlist(@Request() req) {
        await this.wishlistService.clearWishlist(req.user.id);
    }
}
