import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Coupon } from '../entities/coupon.entity';

@Injectable()
export class CouponRepository extends AbstractRepository<Coupon> {
    constructor(
        @InjectRepository(Coupon)
        private readonly couponRepository: Repository<Coupon>,
    ) {
        super(couponRepository);
    }

    // Custom methods specific to Coupon can be added here
    
}