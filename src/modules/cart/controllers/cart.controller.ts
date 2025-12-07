import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CartService } from '../services/cart.service';
import { AddCartItemDto } from '../dtos/add-cart-item.dto';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Cart Controller
 * Manages shopping cart operations for authenticated and guest users
 */
@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    /**
     * Get current user's cart
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get cart', description: 'Get current user shopping cart' })
    @ApiResponse({ status: 200, description: 'Cart retrieved' })
    async getCart(@Request() req) {
        return this.cartService.getOrCreateCart(req.user.id);
    }

    /**
     * Add item to cart
     */
    @Post('items')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Add cart item', description: 'Add product to cart' })
    @ApiBody({ type: AddCartItemDto })
    @ApiResponse({ status: 201, description: 'Item added to cart' })
    @ApiResponse({ status: 400, description: 'Invalid product or insufficient stock' })
    async addItem(
        @Request() req,
        @Body() addCartItemDto: AddCartItemDto
    ) {
        const cart = await this.cartService.getOrCreateCart(req.user.id);
        return this.cartService.addItem(cart.id, addCartItemDto);
    }

    /**
     * Update cart item quantity
     */
    @Patch('items/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Update cart item', description: 'Update cart item quantity' })
    @ApiParam({ name: 'id', description: 'Cart item ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiBody({ type: UpdateCartItemDto })
    @ApiResponse({ status: 200, description: 'Cart item updated' })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    async updateItem(
        @Param('id') id: string,
        @Body() updateCartItemDto: UpdateCartItemDto
    ) {
        return this.cartService.updateItem(id, updateCartItemDto);
    }

    /**
     * Remove item from cart
     */
    @Delete('items/:id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove cart item', description: 'Remove item from cart' })
    @ApiParam({ name: 'id', description: 'Cart item ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 204, description: 'Item removed' })
    @ApiResponse({ status: 404, description: 'Cart item not found' })
    async removeItem(@Param('id') id: string) {
        await this.cartService.removeItem(id);
    }

    /**
     * Clear entire cart
     */
    @Delete()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Clear cart', description: 'Remove all items from cart' })
    @ApiResponse({ status: 204, description: 'Cart cleared' })
    async clearCart(@Request() req) {
        const cart = await this.cartService.getOrCreateCart(req.user.id);
        await this.cartService.clearCart(cart.id);
    }
}
