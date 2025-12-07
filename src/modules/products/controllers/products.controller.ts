import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { FilterDto } from '../dtos/filter.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

/**
 * Products Controller
 * Manages product catalog, filtering, and CRUD operations
 */
@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    /**
     * Get all products with filtering and pagination
     */
    @Get()
    @ApiOperation({ summary: 'Get all products', description: 'Get product list with filters and pagination' })
    @ApiResponse({ status: 200, description: 'Product list retrieved' })
    async findAll(
        @Query() filters: FilterDto,
        @Query() pagination: PaginationDto
    ) {
        return this.productsService.findAll(filters, pagination);
    }

    /**
     * Get product details by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get product details', description: 'Get detailed information about a product' })
    @ApiParam({ name: 'id', description: 'Product ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'Product found' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    /**
     * Create a new product (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create product', description: 'Create a new product (Admin only)' })
    @ApiBody({ type: CreateProductDto })
    @ApiResponse({ status: 201, description: 'Product created' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    /**
     * Update an existing product (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update product', description: 'Update product details (Admin only)' })
    @ApiParam({ name: 'id', description: 'Product ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiBody({ type: UpdateProductDto })
    @ApiResponse({ status: 200, description: 'Product updated' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto
    ) {
        return this.productsService.update(id, updateProductDto);
    }

    /**
     * Delete a product (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete product', description: 'Delete a product (Admin only)' })
    @ApiParam({ name: 'id', description: 'Product ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 204, description: 'Product deleted' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async remove(@Param('id') id: string) {
        await this.productsService.remove(id);
    }
}
