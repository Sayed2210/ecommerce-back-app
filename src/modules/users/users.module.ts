import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { User } from '../auth/entities/user.entity';
import { Address } from './entities/address.entity';
import { UserRepository } from './repositories/user.repository';
// import { OAuthProvider } from './entities/oauth-provider.entity'; // Assuming it exists

@Module({
    imports: [TypeOrmModule.forFeature([User, Address])],
    controllers: [UsersController],
    providers: [UsersService, UserRepository],
    exports: [UsersService, UserRepository],
})
export class UsersModule { }
