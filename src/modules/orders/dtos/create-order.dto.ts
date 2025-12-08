import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
    @ApiProperty({
        description: 'Shipping address ID for order delivery',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    @IsNotEmpty()
    shippingAddressId: string;

    @ApiProperty({
        description: 'Coupon code for discount (optional)',
        example: 'SUMMER2024',
        required: false,
    })
    @IsString()
    @IsOptional()
    couponCode?: string;

    @ApiProperty({
        description: 'Payment method (e.g., credit_card, paypal, stripe)',
        example: 'credit_card',
    })
    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @ApiProperty({
        description: 'Payment token from payment gateway (optional)',
        example: 'tok_1234567890abcdef',
        required: false,
    })
    @IsString()
    @IsOptional()
    paymentToken?: string;
}

