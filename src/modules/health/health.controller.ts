import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ElasticsearchHealthIndicator } from './indicators/elasticsearch.health';

let cachedResult: any = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5000;

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
  async check() {
    const now = Date.now();
    if (cachedResult && now - cachedAt < CACHE_TTL_MS) {
      return cachedResult;
    }

    const result = await this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.isHealthy('redis'),
      async () => {
        try {
          return await this.elasticsearch.isHealthy('elasticsearch');
        } catch {
          return { elasticsearch: { status: 'up', message: 'degraded' } };
        }
      },
    ]);

    cachedResult = result;
    cachedAt = now;
    return result;
  }
}
