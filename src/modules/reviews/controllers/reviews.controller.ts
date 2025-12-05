import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ReviewsService } from '../services/reviews.service';
import { CreateReviewDto } from '../dtos/create-review.dto';
import { UpdateReviewDto } from '../dtos/update-review.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
        return this.reviewsService.create(req.user.id, createReviewDto);
    }

    @Get('product/:productId')
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
