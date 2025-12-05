import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { AddressLabel } from '../entities/address.entity';

export class AddressDto {
    @IsEnum(AddressLabel)
    @IsNotEmpty()
    label: AddressLabel;

    @IsString()
    @IsNotEmpty()
    streetAddress: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsOptional()
    state?: string;

    @IsString()
    @IsNotEmpty()
    country: string;

    @IsString()
    @IsNotEmpty()
    postalCode: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

