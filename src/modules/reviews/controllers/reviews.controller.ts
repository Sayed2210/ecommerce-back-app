import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create review', description: 'Create a product review' })
    @ApiResponse({ status: 201, description: 'Review created' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
        return this.reviewsService.create(req.user.id, createReviewDto);
    }

    @Get('product/:productId')
    @ApiOperation({ summary: 'Get product reviews', description: 'Get all reviews for a product' })
    @ApiResponse({ status: 200, description: 'Reviews retrieved' })
    findAll(@Param('productId') productId: string, @Query() pagination: PaginationDto) {
        return this.reviewsService.findAll(productId, pagination);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.reviewsService.findOne(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Request() req, @Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
        return this.reviewsService.update(id, req.user.id, updateReviewDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Request() req, @Param('id') id: string) {
        return this.reviewsService.remove(id, req.user.id);
    }
}
