import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsArray, IsUUID } from 'class-validator';

export class CreateReviewDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    rating: number;

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    comment?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @IsUUID()
    @IsOptional()
    orderId?: string;
}
