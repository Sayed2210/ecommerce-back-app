// src/modules/admin/entities/audit-log.entity.ts
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/auth/entities/user.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
    @Column()
    action: string;

    @Column({ name: 'resource_type', nullable: true })
    resourceType?: string;

    @Column({ name: 'resource_id', nullable: true })
    resourceId?: string;

    @Column({ name: 'old_values', type: 'jsonb', nullable: true })
    oldValues?: Record<string, any>;

    @Column({ name: 'new_values', type: 'jsonb', nullable: true })
    newValues?: Record<string, any>;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress?: string;

    @Column({ name: 'user_agent', nullable: true })
    userAgent?: string;

    @ManyToOne(() => User, user => user.auditLogs, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user?: User;
}