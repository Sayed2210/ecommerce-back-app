import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@Injectable()
export class UsersService {
    constructor(private readonly userRepository: UserRepository) { }

    async findAll(pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        return this.userRepository.findWithPagination(page, limit);
    }

    async findOne(id: string) {
        const user = await this.userRepository.findOneOrFail({ id });
        return this.sanitizeUser(user);
    }

    async update(id: string, dto: UpdateProfileDto) {
        const user = await this.userRepository.findOneOrFail({ id });

        if (dto.email && dto.email !== user.email) {
            const existing = await this.userRepository.findByEmail(dto.email);
            if (existing) {
                throw new ConflictException('Email already in use');
            }
        }

        const updated = await this.userRepository.update(id, dto);
        return this.sanitizeUser(updated);
    }

    async remove(id: string) {
        await this.userRepository.softDelete(id);
    }

    async getWishlist(userId: string) {
        const user = await this.userRepository.findOneWithOptions({
            where: { id: userId },
            relations: ['wishlist', 'wishlist.product'],
        });
        return user?.wishlist || [];
    }

    private sanitizeUser(user: any) {
        const { password, ...result } = user;
        return result;
    }
}