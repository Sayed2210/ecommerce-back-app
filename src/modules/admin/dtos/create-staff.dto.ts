import { IsNotEmpty, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateStaffDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @IsString()
    @IsOptional()
    department?: string;

    @IsString()
    @IsNotEmpty()
    role: string;

    @IsObject()
    @IsOptional()
    permissions?: Record<string, any>;
}
