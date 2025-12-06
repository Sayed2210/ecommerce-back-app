import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class BrandDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsString()
    @IsOptional()
    website?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
