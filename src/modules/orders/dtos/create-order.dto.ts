import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';
import { RedemptionType } from '@modules/points/entities/point-redemption.entity';

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
    description: 'Payment method',
    example: PaymentMethod.STRIPE,
    enum: PaymentMethod,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Payment token from payment gateway (optional)',
    example: 'tok_1234567890abcdef',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentToken?: string;

  @ApiPropertyOptional({
    description: 'Currency code for checkout (defaults to USD)',
    example: 'EGP',
  })
  @IsString()
  @IsOptional()
  currencyCode?: string;

  @ApiPropertyOptional({
    description: 'Number of points to redeem',
    example: 100,
  })
  @IsNumber()
  @IsOptional()
  redeemPoints?: number;

  @ApiPropertyOptional({
    description: 'Redemption type when using points',
    enum: RedemptionType,
    example: RedemptionType.DISCOUNT,
  })
  @IsEnum(RedemptionType)
  @IsOptional()
  redemptionType?: RedemptionType;
}
