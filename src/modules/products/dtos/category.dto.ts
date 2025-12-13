import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsObject } from 'class-validator';
import { TranslatableString } from '@common/types/translatable.type';

export class CategoryDto {
    @ApiProperty({ example: { en: 'Electronics', ar: 'إلكترونيات' }, description: 'Category name' })
    @IsObject()
    @ValidateNested()
    @Type(() => TranslatableString)
    @IsNotEmpty()
    name: TranslatableString;

    @ApiProperty({ example: { en: 'Gadgets and devices', ar: 'أدوات وأجهزة' }, description: 'Category description', required: false })
    @IsObject()
    @ValidateNested()
    @Type(() => TranslatableString)
    @IsOptional()
    description?: TranslatableString;

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
