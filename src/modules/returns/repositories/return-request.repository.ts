import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AbstractRepository } from '@common/database/abstract.repository';
import { ReturnRequest } from '../entities/return-request.entity';

@Injectable()
export class ReturnRequestRepository extends AbstractRepository<ReturnRequest> {
    constructor(
        @InjectRepository(ReturnRequest)
        private readonly returnRequestRepo: Repository<ReturnRequest>,
    ) {
        super(returnRequestRepo);
    }

    save(entity: ReturnRequest): Promise<ReturnRequest> {
        return this.returnRequestRepo.save(entity);
    }

    findAndCount(options?: FindManyOptions<ReturnRequest>): Promise<[ReturnRequest[], number]> {
        return this.returnRequestRepo.findAndCount(options);
    }
}
