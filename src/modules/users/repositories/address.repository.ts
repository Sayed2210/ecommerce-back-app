import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Address } from '../entities/address.entity';

@Injectable()
export class AddressRepository extends AbstractRepository<Address> {
    constructor(
        @InjectRepository(Address)
        private readonly addressRepository: Repository<Address>,
    ) {
        super(addressRepository);
    }

    // Custom methods specific to Address can be added here
}