import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../entities/address.entity';
import { AddressDto } from '../dtos/address.dto';

@Injectable()
export class AddressesService {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
    ) { }

    async findAll(userId: string) {
        return this.addressRepository.find({
            where: { user: { id: userId } },
            order: { isDefault: 'DESC' },
        });
    }

    async findOne(id: string, userId: string) {
        const address = await this.addressRepository.findOne({
            where: { id, user: { id: userId } },
        });
        if (!address) throw new NotFoundException('Address not found');
        return address;
    }

    async create(userId: string, dto: AddressDto) {
        // Set isDefault to false for all other addresses if this is default
        if (dto.isDefault) {
            await this.addressRepository.update(
                { user: { id: userId }, isDefault: true },
                { isDefault: false },
            );
        }

        return this.addressRepository.save({
            ...dto,
            user: { id: userId },
        });
    }

    async update(id: string, userId: string, dto: AddressDto) {
        await this.findOne(id, userId);

        if (dto.isDefault) {
            await this.addressRepository.update(
                { user: { id: userId }, isDefault: true },
                { isDefault: false },
            );
        }

        return this.addressRepository.update(id, dto);
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId);
        return this.addressRepository.softDelete(id);
    }
}