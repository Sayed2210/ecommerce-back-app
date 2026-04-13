import { IsNotEmpty, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
    @ApiProperty({ description: 'ID of the user to promote to staff' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Unique employee identifier' })
    @IsString()
    @IsNotEmpty()
    employeeId: string;

    @ApiPropertyOptional({ description: 'Department the staff member belongs to' })
    @IsString()
    @IsOptional()
    department?: string;

    @ApiProperty({ description: 'Role of the staff member', enum: ['admin', 'support', 'manager'] })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiPropertyOptional({ description: 'Staff member permissions' })
    @IsObject()
    @IsOptional()
    permissions?: Record<string, any>;
}
