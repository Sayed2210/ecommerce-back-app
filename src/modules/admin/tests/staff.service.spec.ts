import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StaffService } from '../services/staff.service';
import { Staff } from '../entities/staff.entity';

describe('StaffService', () => {
  let service: StaffService;
  let staffRepository: Record<string, jest.Mock>;

  beforeEach(async () => {
    staffRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: getRepositoryToken(Staff), useValue: staffRepository },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      employeeId: 'EMP-001',
      userId: 'u1',
      department: 'Engineering',
    };

    it('creates staff when employee ID is unique', async () => {
      staffRepository.findOne.mockResolvedValue(null);
      const staffEntity = { id: 's1', ...dto };
      staffRepository.create.mockReturnValue(staffEntity);
      staffRepository.save.mockResolvedValue(staffEntity);

      const result = await service.create(dto as any);

      expect(staffRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ employeeId: 'EMP-001', user: { id: 'u1' } }),
      );
      expect(result).toBe(staffEntity);
    });

    it('throws ConflictException when employee ID already exists', async () => {
      staffRepository.findOne.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto as any)).rejects.toThrow(
        ConflictException,
      );
      expect(staffRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns paginated staff list', async () => {
      const staff = [{ id: 's1' }, { id: 's2' }];
      staffRepository.findAndCount.mockResolvedValue([staff, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.page).toBe(1);
    });

    it('applies skip based on page number', async () => {
      staffRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 5 });

      expect(staffRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 }),
      );
    });
  });

  describe('findOne', () => {
    it('returns staff when found', async () => {
      const staff = { id: 's1', employeeId: 'EMP-001' };
      staffRepository.findOne.mockResolvedValue(staff);

      const result = await service.findOne('s1');

      expect(result).toBe(staff);
    });

    it('throws NotFoundException when staff not found', async () => {
      staffRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates staff fields and saves', async () => {
      const staff = { id: 's1', department: 'Sales' } as Staff;
      staffRepository.findOne.mockResolvedValue(staff);
      staffRepository.save.mockResolvedValue({
        ...staff,
        department: 'Engineering',
      });

      const result = await service.update('s1', {
        department: 'Engineering',
      } as any);

      expect(staffRepository.save).toHaveBeenCalled();
      expect(result.department).toBe('Engineering');
    });
  });

  describe('remove', () => {
    it('removes staff by id', async () => {
      const staff = { id: 's1' } as Staff;
      staffRepository.findOne.mockResolvedValue(staff);
      staffRepository.remove.mockResolvedValue(staff);

      await service.remove('s1');

      expect(staffRepository.remove).toHaveBeenCalledWith(staff);
    });

    it('throws NotFoundException when staff not found', async () => {
      staffRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
