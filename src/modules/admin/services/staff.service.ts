import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Staff } from '../entities/staff.entity';
import { CreateStaffDto } from '../dtos/create-staff.dto';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@Injectable()
export class StaffService {
    constructor(
        @InjectRepository(Staff)
        private readonly staffRepository: Repository<Staff>,
    ) { }

    async create(createStaffDto: CreateStaffDto): Promise<Staff> {
        const existing = await this.staffRepository.findOne({ where: { employeeId: createStaffDto.employeeId } });
        if (existing) {
            throw new ConflictException('Employee ID already exists');
        }

        const staff = this.staffRepository.create({
            ...createStaffDto,
            user: { id: createStaffDto.userId },
        });
        return this.staffRepository.save(staff);
    }

    async findAll(pagination: PaginationDto) {
        const { page = 1, limit = 10 } = pagination;
        const [data, total] = await this.staffRepository.findAndCount({
            relations: ['user'],
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    async findOne(id: string): Promise<Staff> {
        const staff = await this.staffRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!staff) {
            throw new NotFoundException(`Staff with ID ${id} not found`);
        }
        return staff;
    }

    async update(id: string, attrs: Partial<Staff>): Promise<Staff> {
        const staff = await this.findOne(id);
        Object.assign(staff, attrs);
        return this.staffRepository.save(staff);
    }

    async remove(id: string): Promise<void> {
        const staff = await this.findOne(id);
        await this.staffRepository.remove(staff);
    }
}
