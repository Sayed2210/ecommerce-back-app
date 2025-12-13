import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsObject, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { TranslatableString } from '@common/types/translatable.type';

export class CreateVariantDto {
    @ApiProperty({
        description: 'Variant name (e.g., "Red - Large", "128GB")',
        example: { en: 'Black - Medium', ar: 'أسود - متوسط' },
    })
    @IsObject()
    @ValidateNested()
    @Type(() => TranslatableString)
    @IsNotEmpty()
    variantName: TranslatableString;

    @ApiProperty({
        description: 'Price modifier (positive or negative)',
        example: 10.00,
        required: false,
        default: 0,
    })
    @IsNumber()
    @IsOptional()
    priceModifier?: number;

    @ApiProperty({
        description: 'Stock Keeping Unit (SKU)',
        example: 'WH-BLK-M-001',
        required: false,
    })
    @IsString()
    @IsOptional()
    sku?: string;

    @ApiProperty({
        description: 'Product barcode',
        example: '1234567890123',
        required: false,
    })
    @IsString()
    @IsOptional()
    barcode?: string;

    @ApiProperty({
        description: 'Inventory quantity for this variant',
        example: 50,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    inventoryQuantity: number;

    @ApiProperty({
        description: 'Low stock threshold for alerts',
        example: 5,
        required: false,
        default: 5,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    lowStockThreshold?: number;

    @ApiProperty({
        description: 'Option values (e.g., {"color": "Black", "size": "Medium"})',
        example: { color: 'Black', size: 'Medium' },
        type: 'object',
    })
    @IsObject()
    @IsNotEmpty()
    optionValues: Record<string, any>;

    @ApiProperty({
        description: 'Variant image URL',
        example: 'https://example.com/variant-image.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({
        description: 'Whether the variant is active',
        example: true,
        required: false,
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateVariantDto {
    @ApiProperty({
        description: 'Variant name',
        example: { en: 'Black - Large', ar: 'أسود - كبير' },
        required: false,
    })
    @IsObject()
    @ValidateNested()
    @Type(() => TranslatableString)
    @IsOptional()
    variantName?: TranslatableString;

    @ApiProperty({
        description: 'Price modifier',
        example: 15.00,
        required: false,
    })
    @IsNumber()
    @IsOptional()
    priceModifier?: number;

    @ApiProperty({
        description: 'Stock Keeping Unit (SKU)',
        example: 'WH-BLK-L-001',
        required: false,
    })
    @IsString()
    @IsOptional()
    sku?: string;

    @ApiProperty({
        description: 'Product barcode',
        example: '1234567890124',
        required: false,
    })
    @IsString()
    @IsOptional()
    barcode?: string;

    @ApiProperty({
        description: 'Inventory quantity',
        example: 75,
        required: false,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    inventoryQuantity?: number;

    @ApiProperty({
        description: 'Low stock threshold',
        example: 10,
        required: false,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    @IsOptional()
    lowStockThreshold?: number;

    @ApiProperty({
        description: 'Option values',
        example: { color: 'Black', size: 'Large' },
        type: 'object',
        required: false,
    })
    @IsObject()
    @IsOptional()
    optionValues?: Record<string, any>;

    @ApiProperty({
        description: 'Variant image URL',
        example: 'https://example.com/new-variant-image.jpg',
        required: false,
    })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiProperty({
        description: 'Whether the variant is active',
        example: true,
        required: false,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
