import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dtos/create-staff.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Staff Controller
 * Manages staff members and their permissions
 */
@Controller('admin/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    /**
     * Get all staff members
     */
    @Get()
    async findAll(@Query() pagination: PaginationDto) {
        return this.staffService.findAll(pagination);
    }

    /**
     * Get staff member by ID
     */
    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.staffService.findOne(id);
    }

    /**
     * Create a new staff member
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createStaffDto: CreateStaffDto) {
        return this.staffService.create(createStaffDto);
    }

    /**
     * Update staff member
     */
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() updateStaffDto: Partial<CreateStaffDto>
    ) {
        return this.staffService.update(id, updateStaffDto);
    }

    /**
     * Delete staff member
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.staffService.remove(id);
    }
}
