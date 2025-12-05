import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class WishlistRepository extends AbstractRepository<Wishlist> {
    constructor(
        @InjectRepository(Wishlist)
        private readonly wishlistRepository: Repository<Wishlist>,
    ) {
        super(wishlistRepository);
    }

    // Custom methods specific to Wishlist can be added here
}
