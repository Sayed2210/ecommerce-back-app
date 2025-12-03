import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { User } from '@modules/auth/entities/user.entity';


import { OAuthProviderType } from '../../auth/entities/oauth-provider.entity';

@Injectable()
export class UserRepository extends AbstractRepository<User> {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
        super(userRepository);
    }

    // Custom methods specific to User can be added here
    async findByEmail(email: string): Promise<User | null> {
        return this.repository.findOne({ where: { email } });
    }

    async findByOAuthProvider(provider: string, providerId: string): Promise<User | null> {
        return this.repository.findOne({
            where: {
                oauthProviders: {
                    provider: provider as OAuthProviderType,
                    providerUserId: providerId
                }
            },
            relations: ['oauthProviders']
        });
    }



}