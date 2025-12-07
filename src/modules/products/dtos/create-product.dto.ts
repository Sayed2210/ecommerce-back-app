import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateVariantDto } from './variant.dto';

export class CreateProductDto {
    @ApiProperty({
        description: 'Product name',
        example: 'Wireless Bluetooth Headphones',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Product description',
        example: 'High-quality wireless headphones with noise cancellation',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        description: 'Base price of the product',
        example: 99.99,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    basePrice: number;

    @ApiProperty({
        description: 'Category ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @ApiProperty({
        description: 'Brand ID',
        example: '123e4567-e89b-12d3-a456-426614174001',
    })
    @IsString()
    @IsNotEmpty()
    brandId: string;

    @ApiProperty({
        description: 'Inventory quantity',
        example: 100,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    inventoryQuantity: number;

    @ApiProperty({
        description: 'Product image URLs',
        example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        required: false,
        type: [String],
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @ApiProperty({
        description: 'Product variants (e.g., different colors, sizes)',
        required: false,
        type: [CreateVariantDto],
        example: [
            {
                variantName: 'Black - Medium',
                priceModifier: 0,
                inventoryQuantity: 50,
                optionValues: { color: 'Black', size: 'Medium' }
            },
            {
                variantName: 'Red - Large',
                priceModifier: 5.00,
                inventoryQuantity: 30,
                optionValues: { color: 'Red', size: 'Large' }
            }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateVariantDto)
    @IsOptional()
    variants?: CreateVariantDto[];

    @ApiProperty({
        description: 'Whether the product is active',
        example: true,
        required: false,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

