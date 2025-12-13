import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { SearchDto } from '../dtos/search.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @ApiOperation({ summary: 'Search products', description: 'Search products by query, category, price, etc.' })
    @ApiResponse({ status: 200, description: 'Search results retrieved' })
    search(@Query() searchDto: SearchDto) {
        return this.searchService.search(searchDto);
    }
}
