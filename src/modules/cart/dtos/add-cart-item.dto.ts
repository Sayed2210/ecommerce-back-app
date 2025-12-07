import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCartItemDto {
    @ApiProperty({
        description: 'Product ID to add to cart',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({
        description: 'Quantity to add',
        example: 2,
        minimum: 1,
    })
    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({
        description: 'Product variant ID (optional, for products with variants)',
        example: '123e4567-e89b-12d3-a456-426614174002',
        required: false,
    })
    @IsUUID()
    @IsOptional()
    variantId?: string;
}

