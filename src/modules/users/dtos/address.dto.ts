import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AddressLabel } from '../entities/address.entity';

export class AddressDto {
    @ApiProperty({
        description: 'Address label/type',
        enum: AddressLabel,
        example: AddressLabel.HOME,
    })
    @IsEnum(AddressLabel)
    @IsNotEmpty()
    label: AddressLabel;

    @ApiProperty({
        description: 'Street address',
        example: '123 Main Street, Apt 4B',
    })
    @IsString()
    @IsNotEmpty()
    streetAddress: string;

    @ApiProperty({
        description: 'City name',
        example: 'New York',
    })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({
        description: 'State or province',
        example: 'NY',
        required: false,
    })
    @IsString()
    @IsOptional()
    state?: string;

    @ApiProperty({
        description: 'Country name',
        example: 'United States',
    })
    @IsString()
    @IsNotEmpty()
    country: string;

    @ApiProperty({
        description: 'Postal/ZIP code',
        example: '10001',
    })
    @IsString()
    @IsNotEmpty()
    postalCode: string;

    @ApiProperty({
        description: 'Set as default address',
        example: true,
        required: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}


