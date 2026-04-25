import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/order.entity';

export class ValidateCheckoutDto {
  @ApiPropertyOptional({
    description: 'Shipping address ID to validate',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  shippingAddressId?: string;

  @ApiPropertyOptional({
    description: 'Payment method to validate',
    example: PaymentMethod.STRIPE,
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;
}

export class ValidateCheckoutResponseDto {
  @ApiProperty({ description: 'Whether checkout data is valid', example: true })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Validation errors if invalid' })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Success message' })
  message?: string;
}
