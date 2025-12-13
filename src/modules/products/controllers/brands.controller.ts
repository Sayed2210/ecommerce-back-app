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
import { BrandsService } from '../services/brands.service';
import { BrandDto } from '../dtos/brand.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Brands Controller
 * Manages product brands and manufacturers
 */
@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    /**
     * Get all brands
     */
    @Get()
    @ApiOperation({ summary: 'Get all brands', description: 'Retrieve a list of all brands' })
    @ApiResponse({ status: 200, description: 'Brands retrieved' })
    async findAll() {
        return this.brandsService.findAll();
    }

    /**
     * Get brand by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get brand', description: 'Retrieve brand details by ID' })
    @ApiParam({ name: 'id', description: 'Brand ID' })
    @ApiResponse({ status: 200, description: 'Brand found' })
    @ApiResponse({ status: 404, description: 'Brand not found' })
    async findOne(@Param('id') id: string) {
        return this.brandsService.findOne(id);
    }

    /**
     * Create a new brand (Admin only)
     */
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create brand', description: 'Create a new brand' })
    @ApiBody({ type: BrandDto })
    @ApiResponse({ status: 201, description: 'Brand created' })
    async create(@Body() createBrandDto: BrandDto) {
        return this.brandsService.create(createBrandDto);
    }

    /**
     * Update a brand (Admin only)
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update brand', description: 'Update brand details' })
    @ApiParam({ name: 'id', description: 'Brand ID' })
    @ApiBody({ type: BrandDto })
    @ApiResponse({ status: 200, description: 'Brand updated' })
    @ApiResponse({ status: 404, description: 'Brand not found' })
    async update(
        @Param('id') id: string,
        @Body() updateBrandDto: BrandDto
    ) {
        return this.brandsService.update(id, updateBrandDto);
    }

    /**
     * Delete a brand (Admin only)
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete brand', description: 'Delete a brand' })
    @ApiParam({ name: 'id', description: 'Brand ID' })
    @ApiResponse({ status: 204, description: 'Brand deleted' })
    async remove(@Param('id') id: string) {
        await this.brandsService.remove(id);
    }
}
