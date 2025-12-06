import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UserRepository } from '../repositories/user.repository';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

describe('UsersService', () => {
    let service: UsersService;
    let userRepository: Partial<Record<keyof UserRepository, jest.Mock>>;

    beforeEach(async () => {
        userRepository = {
            findWithPagination: jest.fn(),
            findOneOrFail: jest.fn(),
            findByEmail: jest.fn(),
            update: jest.fn(),
            findOneWithOptions: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: UserRepository, useValue: userRepository },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated users', async () => {
            const pagination: PaginationDto = { page: 1, limit: 10 };
            const result = { data: [], total: 0, page: 1, limit: 10 };
            userRepository.findWithPagination.mockResolvedValue(result);

            expect(await service.findAll(pagination)).toBe(result);
            expect(userRepository.findWithPagination).toHaveBeenCalledWith(1, 10);
        });
    });

    describe('findOne', () => {
        it('should return a sanitized user', async () => {
            const user = { id: '1', email: 'test@test.com', passwordHash: 'hash', refreshTokens: 'rt' };
            userRepository.findOneOrFail.mockResolvedValue(user);

            const result = await service.findOne('1');
            expect(result).toEqual({ id: '1', email: 'test@test.com' });
            expect(result).not.toHaveProperty('passwordHash');
            expect(result).not.toHaveProperty('refreshTokens');
        });

        it('should throw if user not found', async () => {
            userRepository.findOneOrFail.mockRejectedValue(new NotFoundException());
            await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update user profile', async () => {
            const dto: UpdateProfileDto = { firstName: 'New' };
            const user = { id: '1', email: 'test@test.com' };
            const updatedUser = { ...user, ...dto };

            userRepository.findOneOrFail.mockResolvedValue(user);
            userRepository.update.mockResolvedValue(updatedUser);

            const result = await service.update('1', dto);
            expect(result.firstName).toBe('New');
            expect(userRepository.update).toHaveBeenCalledWith('1', dto);
        });

        it('should throw conflict if email is taken', async () => {
            const dto: UpdateProfileDto = { email: 'taken@test.com' };
            const user = { id: '1', email: 'original@test.com' };
            const existingUser = { id: '2', email: 'taken@test.com' };

            userRepository.findOneOrFail.mockResolvedValue(user);
            userRepository.findByEmail.mockResolvedValue(existingUser);

            await expect(service.update('1', dto)).rejects.toThrow(ConflictException);
        });
    });

    describe('remove', () => {
        it('should logically delete user', async () => {
            await service.remove('1');
            expect(userRepository.update).toHaveBeenCalledWith('1', { isActive: false });
        });
    });

    describe('getWishlist', () => {
        it('should return user wishlist', async () => {
            const wishlist = [{ id: 'w1' }];
            userRepository.findOneWithOptions.mockResolvedValue({ wishlist });
            expect(await service.getWishlist('1')).toBe(wishlist);
        });

        it('should return empty array if user not found or no wishlist', async () => {
            userRepository.findOneWithOptions.mockResolvedValue(null);
            expect(await service.getWishlist('1')).toEqual([]);
        });
    });
});
