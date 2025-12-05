import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    shippingAddressId: string;

    @IsString()
    @IsOptional()
    couponCode?: string;

    @IsString()
    @IsNotEmpty()
    paymentMethod: string;

    @IsString()
    @IsOptional()
    paymentToken?: string;
}
