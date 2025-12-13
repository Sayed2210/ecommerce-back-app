import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
    @ApiProperty({ example: 'Electronics', description: 'Category name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'Gadgets and devices', description: 'Category description', required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: null, description: 'Parent Category ID', required: false })
    @IsString()
    @IsOptional()
    parentId?: string;

    @ApiProperty({ example: 1, description: 'Display order', required: false })
    @IsNumber()
    @IsOptional()
    displayOrder?: number;

    @ApiProperty({ example: true, description: 'Is category active?', required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
