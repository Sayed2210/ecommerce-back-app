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
import { BrandsService } from '../services/brands.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Brands Controller
 * Manages product brands and manufacturers
 */
@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    /**
     * Get all brands
     */
    @Get()
    async findAll() {
        return this.brandsService.findAll();
    }

    /**
     * Get brand by ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.brandsService.findOne(id);
    }

    /**
     * Create a new brand (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createBrandDto: any) {
        return this.brandsService.create(createBrandDto);
    }

    /**
     * Update a brand (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    async update(
        @Param('id') id: string,
        @Body() updateBrandDto: any
    ) {
        return this.brandsService.update(id, updateBrandDto);
    }

    /**
     * Delete a brand (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.brandsService.remove(id);
    }
}
