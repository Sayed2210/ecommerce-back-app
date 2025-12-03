import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class FilterDto {
    @IsString()
    @IsOptional()
    category?: string;

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
}
