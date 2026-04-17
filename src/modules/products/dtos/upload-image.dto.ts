import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadImageDto {
    // Used only for Swagger UI multipart documentation; the actual file arrives via @UploadedFile()
    @ApiProperty({ type: 'string', format: 'binary', description: 'Image file (JPEG, PNG, WebP — max 5 MB)' })
    image?: Express.Multer.File;

    @ApiPropertyOptional({ description: 'Alt text for accessibility and SEO' })
    @IsOptional()
    @IsString()
    altText?: string;

    @ApiPropertyOptional({ description: 'Display order (0 = first)', default: 0 })
    @IsOptional()
    @IsInt()
    @Min(0)
    @Type(() => Number)
    displayOrder?: number;

    @ApiPropertyOptional({ description: 'Variant ID to associate the image with a specific variant' })
    @IsOptional()
    @IsUUID()
    variantId?: string;
}
