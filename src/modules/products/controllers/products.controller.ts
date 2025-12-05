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
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { FilterDto } from '../dtos/filter.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Products Controller
 * Manages product catalog, filtering, and CRUD operations
 */
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    /**
     * Get all products with filtering and pagination
     */
    @Get()
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
    async findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    /**
     * Create a new product (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto);
    }

    /**
     * Update an existing product (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
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
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.productsService.remove(id);
    }
}
