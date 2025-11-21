import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { User } from '../entities/user.entity';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    // Custom methods specific to User
    async findByEmail(email: string): Promise<User | null> {
        return this.findOne({ email } as any);
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.findOne({ username } as any);
    }
}