import { IsNotEmpty, IsString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateAuditLogDto {
    @IsString()
    @IsNotEmpty()
    action: string;

    @IsString()
    @IsOptional()
    resourceType?: string;

    @IsString()
    @IsOptional()
    resourceId?: string;

    @IsObject()
    @IsOptional()
    oldValues?: Record<string, any>;

    @IsObject()
    @IsOptional()
    newValues?: Record<string, any>;

    @IsString()
    @IsOptional()
    ipAddress?: string;

    @IsString()
    @IsOptional()
    userAgent?: string;

    @IsUUID()
    @IsOptional()
    userId?: string;
}
