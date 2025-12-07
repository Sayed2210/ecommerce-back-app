import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FilterDto {
    @ApiProperty({
        description: 'Filter by category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
        required: false,
    })
    @IsString()
    @IsOptional()
    categoryId?: string;

    @ApiProperty({
        description: 'Filter by brand ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
        required: false,
    })
    @IsString()
    @IsOptional()
    brandId?: string;

    @ApiProperty({
        description: 'Search query for product name or description',
        example: 'wireless headphones',
        required: false,
    })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({
        description: 'Sort field (e.g., price, name, createdAt)',
        example: 'price',
        required: false,
    })
    @IsString()
    @IsOptional()
    sortBy?: string;

    @ApiProperty({
        description: 'Minimum price filter',
        example: 10.0,
        required: false,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    minPrice?: number;

    @ApiProperty({
        description: 'Maximum price filter',
        example: 500.0,
        required: false,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    maxPrice?: number;
}
