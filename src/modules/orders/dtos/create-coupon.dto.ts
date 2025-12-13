import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponType } from '../entities/coupon.entity';

export class CreateCouponDto {
    @ApiProperty({ description: 'Coupon Code', example: 'SUMMER2025' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ enum: CouponType, description: 'Type of coupon' })
    @IsEnum(CouponType)
    type: CouponType;

    @ApiPropertyOptional({ description: 'Discount value (amount or percentage)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    value?: number;

    @ApiPropertyOptional({ description: 'Maximum discount amount for percentage coupons' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxDiscount?: number;

    @ApiPropertyOptional({ description: 'Minimum order value required', default: 0 })
    @IsNumber()
    @IsOptional()
    @Min(0)
    minOrderValue?: number;

    @ApiPropertyOptional({ description: 'Total number of times coupon can be used' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    usageLimit?: number;

    @ApiProperty({ description: 'Start date of the coupon' })
    @IsDateString()
    @IsNotEmpty()
    startDate: Date;

    @ApiPropertyOptional({ description: 'Expiration date of the coupon' })
    @IsDateString()
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Is coupon active?', default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

export class UpdateCouponDto {
    @ApiPropertyOptional({ description: 'Type of coupon' })
    @IsEnum(CouponType)
    @IsOptional()
    type?: CouponType;

    @ApiPropertyOptional({ description: 'Discount value (amount or percentage)' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    value?: number;

    @ApiPropertyOptional({ description: 'Maximum discount amount for percentage coupons' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    maxDiscount?: number;

    @ApiPropertyOptional({ description: 'Minimum order value required' })
    @IsNumber()
    @IsOptional()
    @Min(0)
    minOrderValue?: number;

    @ApiPropertyOptional({ description: 'Total number of times coupon can be used' })
    @IsNumber()
    @IsOptional()
    @Min(1)
    usageLimit?: number;

    @ApiPropertyOptional({ description: 'Start date of the coupon' })
    @IsDateString()
    @IsOptional()
    startDate?: Date;

    @ApiPropertyOptional({ description: 'Expiration date of the coupon' })
    @IsDateString()
    @IsOptional()
    endDate?: Date;

    @ApiPropertyOptional({ description: 'Is coupon active?' })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
