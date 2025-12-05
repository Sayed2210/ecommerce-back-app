import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from './elasticsearch.service';
import { SearchDto } from '../dtos/search.dto';

@Injectable()
export class SearchService {
    constructor(private readonly elasticsearchService: ElasticsearchService) { }

    async search(dto: SearchDto) {
        return this.elasticsearchService.search(dto.query || '', dto);
    }
}
