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
import { CartService } from '../services/cart.service';
import { AddCartItemDto } from '../dtos/add-cart-item.dto';
import { UpdateCartItemDto } from '../dtos/update-cart-item.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Cart Controller
 * Manages shopping cart operations for authenticated and guest users
 */
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    /**
     * Get current user's cart
     */
    @Get()
    @UseGuards(JwtAuthGuard)
    async getCart(@Request() req) {
        return this.cartService.getOrCreateCart(req.user.id);
    }

    /**
     * Add item to cart
     */
    @Post('items')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
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
    async removeItem(@Param('id') id: string) {
        await this.cartService.removeItem(id);
    }

    /**
     * Clear entire cart
     */
    @Delete()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async clearCart(@Request() req) {
        const cart = await this.cartService.getOrCreateCart(req.user.id);
        await this.cartService.clearCart(cart.id);
    }
}
