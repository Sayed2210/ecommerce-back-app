import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ElasticsearchService } from '@modules/search/services/elasticsearch.service';

@Injectable()
export class ElasticsearchHealthIndicator extends HealthIndicator {
    constructor(private readonly elasticsearchService: ElasticsearchService) {
        super();
    }

    async isHealthy(key: string): Promise<HealthIndicatorResult> {
        try {
            await this.elasticsearchService.ping();
            return this.getStatus(key, true);
        } catch {
            const result = this.getStatus(key, false);
            throw new HealthCheckError('Elasticsearch check failed', result);
        }
    }
}
