import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../auth/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
    nullable: true,
  })
  phone?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
    nullable: true,
  })
  avatarUrl?: string;

  @ApiProperty({ description: 'Email verified status', example: true })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Account active status', example: true })
  isActive: boolean;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CUSTOMER,
  })
  role: UserRole;

  @ApiProperty({
    description: 'Last login date',
    required: false,
    nullable: true,
  })
  lastLogin?: Date;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Account update date' })
  updatedAt: Date;
}
