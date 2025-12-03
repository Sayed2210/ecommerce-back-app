import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SearchDto {
    @IsString()
    @IsOptional()
    query?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    brands?: string[];

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    minPrice?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => parseFloat(value))
    maxPrice?: number;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    inStock?: boolean;

    @IsString()
    @IsOptional()
    sortBy?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 1)
    page: number = 1;

    @IsNumber()
    @Min(1)
    @IsOptional()
    @Transform(({ value }) => parseInt(value) || 10)
    limit: number = 10;
}
