import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsArray, IsBoolean, IsObject } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    basePrice: number;

    @IsString()
    @IsNotEmpty()
    categoryId: string;

    @IsString()
    @IsNotEmpty()
    brandId: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    inventoryQuantity: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
