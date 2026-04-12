import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
    @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5, example: 4 })
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    rating: number;

    @ApiPropertyOptional({ description: 'Review title', example: 'Great product!' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ description: 'Detailed review comment' })
    @IsString()
    @IsOptional()
    comment?: string;

    @ApiPropertyOptional({ description: 'Array of image URLs', example: ['https://example.com/img1.jpg'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @ApiProperty({ description: 'ID of the product being reviewed', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsNotEmpty()
    productId: string;

    @ApiPropertyOptional({ description: 'ID of the associated order (for verified purchase)', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    @IsOptional()
    orderId?: string;
}
