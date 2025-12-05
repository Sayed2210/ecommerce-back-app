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
import { CategoriesService } from '../services/categories.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Categories Controller
 * Manages product categories and hierarchies
 */
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    /**
     * Get all categories
     */
    @Get()
    async findAll() {
        return this.categoriesService.findAll();
    }

    /**
     * Get category by ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    /**
     * Create a new category (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCategoryDto: any) {
        return this.categoriesService.create(createCategoryDto);
    }

    /**
     * Update a category (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: any
    ) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    /**
     * Delete a category (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.categoriesService.remove(id);
    }
}
