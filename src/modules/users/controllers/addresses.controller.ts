import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { AddressesService } from '../services/addresses.service';
import { AddressDto } from '../dtos/address.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Addresses Controller
 * Manages user shipping and billing addresses
 */
@ApiTags('User Addresses')
@ApiBearerAuth()
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    /**
     * Get all addresses for current user
     */
    @Get()
    @ApiOperation({ summary: 'Get user addresses', description: 'Get all addresses for authenticated user' })
    @ApiResponse({ status: 200, description: 'Addresses retrieved' })
    async findAll(@Request() req) {
        return this.addressesService.findAll(req.user.id);
    }

    /**
     * Create a new address
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create address', description: 'Add a new shipping/billing address' })
    @ApiBody({ type: AddressDto })
    @ApiResponse({ status: 201, description: 'Address created' })
    @ApiResponse({ status: 400, description: 'Invalid address data' })
    async create(
        @Request() req,
        @Body() addressDto: AddressDto
    ) {
        return this.addressesService.create(req.user.id, addressDto);
    }

    /**
     * Update an existing address
     */
    @Patch(':id')
    @ApiOperation({ summary: 'Update address', description: 'Update an existing address' })
    @ApiParam({ name: 'id', description: 'Address ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiBody({ type: AddressDto })
    @ApiResponse({ status: 200, description: 'Address updated' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async update(
        @Request() req,
        @Param('id') id: string,
        @Body() addressDto: AddressDto
    ) {
        return this.addressesService.update(req.user.id, id, addressDto);
    }

    /**
     * Set address as default
     */
    @Patch(':id/default')
    @ApiOperation({ summary: 'Set default address', description: 'Set an address as the default' })
    @ApiParam({ name: 'id', description: 'Address ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'Default address updated' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async setDefault(
        @Request() req,
        @Param('id') id: string
    ) {
        return this.addressesService.setDefault(req.user.id, id);
    }

    /**
     * Delete an address
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete address', description: 'Remove an address from user account' })
    @ApiParam({ name: 'id', description: 'Address ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 204, description: 'Address deleted' })
    @ApiResponse({ status: 404, description: 'Address not found' })
    async remove(
        @Request() req,
        @Param('id') id: string
    ) {
        await this.addressesService.remove(req.user.id, id);
    }
}
