import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, IsObject } from 'class-validator';
import { TranslatableString } from '@common/types/translatable.type';

export class BrandDto {
    @ApiProperty({ example: { en: 'Nike', ar: 'نايك' }, description: 'Brand name' })
    @IsObject()
    @ValidateNested()
    @Type(() => TranslatableString)
    @IsNotEmpty()
    name: TranslatableString;

    @ApiProperty({ example: { en: 'Just Do It', ar: 'فقط افعلها' }, description: 'Brand description', required: false })
    @IsObject()
    @ValidateNested()
    @Type(() => TranslatableString)
    @IsOptional()
    description?: TranslatableString;

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
