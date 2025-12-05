import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from '../services/search.service';
import { SearchDto } from '../dtos/search.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    search(@Query() searchDto: SearchDto) {
        return this.searchService.search(searchDto);
    }
}
