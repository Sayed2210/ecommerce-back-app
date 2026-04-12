import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './indicators/redis.health';
import { ElasticsearchHealthIndicator } from './indicators/elasticsearch.health';
import { SearchModule } from '@modules/search/search.module';

@Module({
    imports: [TerminusModule, TypeOrmModule, SearchModule],
    controllers: [HealthController],
    providers: [RedisHealthIndicator, ElasticsearchHealthIndicator],
})
export class HealthModule {}
