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
import { AddressesService } from '../services/addresses.service';
import { AddressDto } from '../dtos/address.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Addresses Controller
 * Manages user shipping and billing addresses
 */
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    /**
     * Get all addresses for current user
     */
    @Get()
    async findAll(@Request() req) {
        return this.addressesService.findAll(req.user.id);
    }

    /**
     * Create a new address
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
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
    async remove(
        @Request() req,
        @Param('id') id: string
    ) {
        await this.addressesService.remove(req.user.id, id);
    }
}
