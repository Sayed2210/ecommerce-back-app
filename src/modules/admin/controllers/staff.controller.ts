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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { StaffService } from '../services/staff.service';
import { CreateStaffDto } from '../dtos/create-staff.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Staff Controller
 * Manages staff members and their permissions
 */
@ApiTags('Admin Staff')
@ApiBearerAuth()
@Controller('admin/staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    /**
     * Get all staff members
     */
    @Get()
    @ApiOperation({ summary: 'Get all staff', description: 'Retrieve list of staff members' })
    @ApiResponse({ status: 200, description: 'Staff list retrieved' })
    async findAll(@Query() pagination: PaginationDto) {
        return this.staffService.findAll(pagination);
    }

    /**
     * Get staff member by ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get staff details', description: 'Retrieve staff member details' })
    @ApiParam({ name: 'id', description: 'Staff ID' })
    @ApiResponse({ status: 200, description: 'Staff member found' })
    @ApiResponse({ status: 404, description: 'Staff member not found' })
    async findOne(@Param('id') id: string) {
        return this.staffService.findOne(id);
    }

    /**
     * Create a new staff member
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create staff', description: 'Create a new staff member' })
    @ApiBody({ type: CreateStaffDto })
    @ApiResponse({ status: 201, description: 'Staff member created' })
    async create(@Body() createStaffDto: CreateStaffDto) {
        return this.staffService.create(createStaffDto);
    }

    /**
     * Update staff member
     */
    @Patch(':id')
    @ApiOperation({ summary: 'Update staff', description: 'Update staff member details' })
    @ApiParam({ name: 'id', description: 'Staff ID' })
    @ApiBody({ type: CreateStaffDto, description: 'Partial update allowed' })
    @ApiResponse({ status: 200, description: 'Staff updated' })
    @ApiResponse({ status: 404, description: 'Staff not found' })
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
    @ApiOperation({ summary: 'Delete staff', description: 'Remove a staff member' })
    @ApiParam({ name: 'id', description: 'Staff ID' })
    @ApiResponse({ status: 204, description: 'Staff deleted' })
    async remove(@Param('id') id: string) {
        await this.staffService.remove(id);
    }
}
