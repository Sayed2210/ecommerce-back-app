import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { CouponService } from '../services/coupon.service';
import { CreateCouponDto, UpdateCouponDto } from '../dtos/create-coupon.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

/**
 * Coupons Controller
 * Manages coupons (Admin only)
 */
@ApiTags('Coupons')
@ApiBearerAuth()
@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CouponsController {
    constructor(private readonly couponService: CouponService) { }

    @Post()
    @ApiOperation({ summary: 'Create Coupon', description: 'Create a new coupon' })
    @ApiBody({ type: CreateCouponDto })
    @ApiResponse({ status: 201, description: 'Coupon created' })
    @ApiResponse({ status: 400, description: 'Invalid data or code exists' })
    async create(@Body() createCouponDto: CreateCouponDto) {
        return this.couponService.create(createCouponDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all coupons', description: 'List all coupons' })
    @ApiResponse({ status: 200, description: 'List of coupons' })
    async findAll() {
        return this.couponService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get coupon', description: 'Get coupon by ID' })
    @ApiParam({ name: 'id', description: 'Coupon ID' })
    @ApiResponse({ status: 200, description: 'Coupon details' })
    @ApiResponse({ status: 404, description: 'Coupon not found' })
    async findOne(@Param('id') id: string) {
        return this.couponService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update coupon', description: 'Update coupon details' })
    @ApiParam({ name: 'id', description: 'Coupon ID' })
    @ApiBody({ type: UpdateCouponDto })
    @ApiResponse({ status: 200, description: 'Coupon updated' })
    @ApiResponse({ status: 404, description: 'Coupon not found' })
    async update(
        @Param('id') id: string,
        @Body() updateCouponDto: UpdateCouponDto
    ) {
        return this.couponService.update(id, updateCouponDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete coupon', description: 'Delete coupon' })
    @ApiParam({ name: 'id', description: 'Coupon ID' })
    @ApiResponse({ status: 204, description: 'Coupon deleted' })
    @ApiResponse({ status: 404, description: 'Coupon not found' })
    async remove(@Param('id') id: string) {
        await this.couponService.remove(id);
    }
}
