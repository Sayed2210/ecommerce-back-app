import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductImagesService } from '../services/images.service';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { S3Service } from '@infrastructure/storage/s3.service';

const mockProductRepo = {
    findOne: jest.fn(),
};

const mockImageRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
};

const mockS3 = {
    buildKey: jest.fn().mockReturnValue('products/prod-1/uuid.jpg'),
    uploadFile: jest.fn().mockResolvedValue('https://bucket.s3.us-east-1.amazonaws.com/products/prod-1/uuid.jpg'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
};

const mockDataSource = {
    transaction: jest.fn((cb) => cb({
        update: jest.fn().mockResolvedValue({}),
    })),
};

const makeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    fieldname: 'image',
    originalname: 'photo.jpg',
    mimetype: 'image/jpeg',
    size: 1024 * 100, // 100 KB
    buffer: Buffer.from('fake-image'),
    encoding: '7bit',
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
    ...overrides,
});

describe('ProductImagesService', () => {
    let service: ProductImagesService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductImagesService,
                { provide: getRepositoryToken(Product), useValue: mockProductRepo },
                { provide: getRepositoryToken(ProductImage), useValue: mockImageRepo },
                { provide: S3Service, useValue: mockS3 },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = module.get<ProductImagesService>(ProductImagesService);
    });

    afterEach(() => jest.clearAllMocks());

    describe('upload', () => {
        it('throws 404 when product does not exist', async () => {
            mockProductRepo.findOne.mockResolvedValue(null);

            await expect(service.upload('prod-1', makeFile(), {})).rejects.toThrow(NotFoundException);
            expect(mockS3.uploadFile).not.toHaveBeenCalled();
        });

        it('throws 400 for unsupported MIME type', async () => {
            mockProductRepo.findOne.mockResolvedValue({ id: 'prod-1' });

            await expect(
                service.upload('prod-1', makeFile({ mimetype: 'application/pdf' }), {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws 400 when file exceeds 5 MB', async () => {
            mockProductRepo.findOne.mockResolvedValue({ id: 'prod-1' });

            await expect(
                service.upload('prod-1', makeFile({ size: 6 * 1024 * 1024 }), {}),
            ).rejects.toThrow(BadRequestException);
        });

        it('uploads to S3 and saves image record', async () => {
            mockProductRepo.findOne.mockResolvedValue({ id: 'prod-1' });
            mockImageRepo.count.mockResolvedValue(0);
            mockImageRepo.create.mockReturnValue({ id: 'img-1', url: 'https://bucket.s3.us-east-1.amazonaws.com/products/prod-1/uuid.jpg', isPrimary: true });
            mockImageRepo.save.mockResolvedValue({ id: 'img-1', url: 'https://bucket.s3.us-east-1.amazonaws.com/products/prod-1/uuid.jpg', isPrimary: true });

            const result = await service.upload('prod-1', makeFile(), { altText: 'Front view' });

            expect(mockS3.uploadFile).toHaveBeenCalledWith(
                'products/prod-1/uuid.jpg',
                expect.any(Buffer),
                'image/jpeg',
            );
            expect(mockImageRepo.save).toHaveBeenCalled();
            expect(result.isPrimary).toBe(true); // first image is auto-primary
        });

        it('does not set isPrimary when other images already exist', async () => {
            mockProductRepo.findOne.mockResolvedValue({ id: 'prod-1' });
            mockImageRepo.count.mockResolvedValue(2);
            mockImageRepo.create.mockReturnValue({ id: 'img-2', isPrimary: false });
            mockImageRepo.save.mockResolvedValue({ id: 'img-2', isPrimary: false });

            const result = await service.upload('prod-1', makeFile(), {});

            expect(result.isPrimary).toBe(false);
        });
    });

    describe('remove', () => {
        it('throws 404 when image not found', async () => {
            mockImageRepo.findOne.mockResolvedValue(null);

            await expect(service.remove('prod-1', 'img-1')).rejects.toThrow(NotFoundException);
        });

        it('deletes from S3 and removes DB record', async () => {
            const image = {
                id: 'img-1',
                url: 'https://bucket.s3.us-east-1.amazonaws.com/products/prod-1/uuid.jpg',
                isPrimary: false,
            };
            mockImageRepo.findOne.mockResolvedValue(image);
            mockImageRepo.remove.mockResolvedValue(image);

            await service.remove('prod-1', 'img-1');

            expect(mockS3.deleteFile).toHaveBeenCalledWith('products/prod-1/uuid.jpg');
            expect(mockImageRepo.remove).toHaveBeenCalledWith(image);
        });

        it('promotes next image to primary when primary is deleted', async () => {
            const image = {
                id: 'img-1',
                url: 'https://bucket.s3.us-east-1.amazonaws.com/products/prod-1/uuid.jpg',
                isPrimary: true,
            };
            const nextImage = { id: 'img-2', isPrimary: false };

            mockImageRepo.findOne
                .mockResolvedValueOnce(image)    // finding the image to delete
                .mockResolvedValueOnce(nextImage); // finding the next image
            mockImageRepo.remove.mockResolvedValue(image);
            mockImageRepo.update.mockResolvedValue({});

            await service.remove('prod-1', 'img-1');

            expect(mockImageRepo.update).toHaveBeenCalledWith('img-2', { isPrimary: true });
        });
    });

    describe('setPrimary', () => {
        it('throws 404 when image not found', async () => {
            mockImageRepo.findOne.mockResolvedValue(null);

            await expect(service.setPrimary('prod-1', 'img-1')).rejects.toThrow(NotFoundException);
        });

        it('clears all primary flags then sets the target', async () => {
            const image = { id: 'img-2', product: { id: 'prod-1' }, isPrimary: false };
            mockImageRepo.findOne.mockResolvedValue(image);

            const result = await service.setPrimary('prod-1', 'img-2');

            expect(result.isPrimary).toBe(true);
        });
    });

    describe('findAll', () => {
        it('throws 404 when product does not exist', async () => {
            mockProductRepo.findOne.mockResolvedValue(null);

            await expect(service.findAll('prod-1')).rejects.toThrow(NotFoundException);
        });

        it('returns images ordered by displayOrder', async () => {
            mockProductRepo.findOne.mockResolvedValue({ id: 'prod-1' });
            const images = [{ id: 'img-1', displayOrder: 0 }, { id: 'img-2', displayOrder: 1 }];
            mockImageRepo.find.mockResolvedValue(images);

            const result = await service.findAll('prod-1');

            expect(result).toHaveLength(2);
            expect(mockImageRepo.find).toHaveBeenCalledWith(
                expect.objectContaining({ order: { displayOrder: 'ASC', createdAt: 'ASC' } }),
            );
        });
    });
});
