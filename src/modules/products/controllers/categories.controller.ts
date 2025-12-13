import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import { CategoryDto } from '../dtos/category.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Categories Controller
 * Manages product categories and hierarchies
 */
@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    /**
     * Get all categories
     */
    @Get()
    @ApiOperation({ summary: 'Get all categories', description: 'Retrieve a list of all categories' })
    @ApiResponse({ status: 200, description: 'Categories retrieved' })
    async findAll() {
        return this.categoriesService.findAll();
    }

    /**
     * Get category by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get category', description: 'Retrieve category details by ID' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category found' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    /**
     * Create a new category (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create category', description: 'Create a new category' })
    @ApiBody({ type: CategoryDto })
    @ApiResponse({ status: 201, description: 'Category created' })
    async create(@Body() createCategoryDto: CategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    /**
     * Update a category (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category', description: 'Update category details' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiBody({ type: CategoryDto })
    @ApiResponse({ status: 200, description: 'Category updated' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: CategoryDto
    ) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    /**
     * Delete a category (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete category', description: 'Delete a category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 204, description: 'Category deleted' })
    async remove(@Param('id') id: string) {
        await this.categoriesService.remove(id);
    }
}
