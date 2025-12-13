import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchDto {
    @ApiProperty({ example: 'iPhone', description: 'Search query', required: false })
    @IsString()
    @IsOptional()
    query?: string;

    @ApiProperty({ example: 'electronics', description: 'Category slug', required: false })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({ example: ['apple', 'samsung'], description: 'Brand slugs', required: false, type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    brands?: string[];

    @ApiProperty({ example: 100, description: 'Minimum price', required: false })
    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    minPrice?: number;

    @ApiProperty({ example: 1000, description: 'Maximum price', required: false })
    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    maxPrice?: number;

    @ApiProperty({ example: true, description: 'In stock only', required: false })
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    inStock?: boolean;

    @ApiProperty({ example: 'price_asc', description: 'Sort order', required: false })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiProperty({ example: 1, description: 'Page number', required: false, default: 1 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 1)
    page: number = 1;

    @ApiProperty({ example: 10, description: 'Items per page', required: false, default: 10 })
    @IsNumber()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 10)
    limit: number = 10;
}
