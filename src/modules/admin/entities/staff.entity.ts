// src/modules/admin/entities/staff.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';

@Entity('staff')
export class Staff extends BaseEntity {
    @Column({ name: 'employee_id', unique: true })
    employeeId: string;

    @Column({ name: 'department', nullable: true })
    department?: string;

    @Column({ name: 'permissions', type: 'jsonb', default: {} })
    permissions: Record<string, any>;

    @Column()
    role: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}