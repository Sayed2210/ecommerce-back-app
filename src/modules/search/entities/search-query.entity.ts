import { Entity, Column } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('search_queries')
export class SearchQuery extends BaseEntity {
    @Column()
    query: string;

    @Column({ name: 'user_id', nullable: true })
    userId?: string;

    @Column({ name: 'result_count' })
    resultCount: number;

    @Column({ type: 'jsonb', default: {} })
    filters: Record<string, any>;

    @Column({ name: 'session_id', nullable: true })
    sessionId?: string;
}