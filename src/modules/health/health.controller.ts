import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ElasticsearchHealthIndicator } from './indicators/elasticsearch.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db: TypeOrmHealthIndicator,
        private readonly redis: RedisHealthIndicator,
        private readonly elasticsearch: ElasticsearchHealthIndicator,
    ) {}

    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Service health check (DB, Redis, Elasticsearch)' })
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.redis.isHealthy('redis'),
            () => this.elasticsearch.isHealthy('elasticsearch'),
        ]);
    }
}
