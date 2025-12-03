import { IsNotEmpty, IsUUID, IsNumber, Min, IsOptional } from 'class-validator';

export class AddCartItemDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    quantity: number;

    @IsUUID()
    @IsOptional()
    variantId?: string;
}
