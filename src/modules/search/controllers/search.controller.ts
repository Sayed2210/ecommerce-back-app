import { Controller, Get, Post, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SearchService } from '../services/search.service';
import { SearchDto } from '../dtos/search.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/auth/entities/user.entity';

@ApiTags('Search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { ttl: 60000, limit: 30 } })
    @ApiOperation({ summary: 'Search products', description: 'Search products by query, category, price, etc.' })
    @ApiResponse({ status: 200, description: 'Search results retrieved' })
    search(@Query() searchDto: SearchDto) {
        return this.searchService.search(searchDto);
    }

    @Post('reindex')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reindex all products',
        description: 'Bulk re-index all products into Elasticsearch. Admin only. Use after data migrations or when search results are stale.',
    })
    @ApiResponse({ status: 200, description: 'Reindex complete', schema: { example: { indexed: 250, errors: 0 } } })
    reindex() {
        return this.searchService.reindexAll();
    }
}
