import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BrandDto {
    @ApiProperty({ example: 'Nike', description: 'Brand name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Just Do It', description: 'Brand description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'https://example.com/logo.png', description: 'Logo URL', required: false })
    @IsString()
    @IsOptional()
    logoUrl?: string;

    @ApiProperty({ example: 'https://nike.com', description: 'Website URL', required: false })
    @IsString()
    @IsOptional()
    website?: string;

    @ApiProperty({ example: true, description: 'Is brand active?', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
