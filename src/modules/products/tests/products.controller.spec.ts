import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '../controllers/products.controller';
import { ProductsService } from '../services/products.service';

const mockProductsService = () => ({
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});

describe('ProductsController', () => {
    let controller: ProductsController;
    let service: any;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProductsController],
            providers: [
                { provide: ProductsService, useFactory: mockProductsService },
            ],
        }).compile();

        controller = module.get<ProductsController>(ProductsController);
        service = module.get<ProductsService>(ProductsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return paginated products', async () => {
            const query = { page: 1, limit: 10 };
            const filters = {};
            const result = { data: [], total: 0 };
            service.findAll.mockResolvedValue(result);

            expect(await controller.findAll(filters, query)).toBe(result);
            expect(service.findAll).toHaveBeenCalledWith(filters, query);
        });
    });

    describe('findOne', () => {
        it('should return a product', async () => {
            const result = { id: 'p1' };
            service.findOne.mockResolvedValue(result);

            expect(await controller.findOne('p1')).toBe(result);
            expect(service.findOne).toHaveBeenCalledWith('p1');
        });
    });

    describe('create', () => {
        it('should create a product', async () => {
            const dto = { name: 'Prod' };
            const result = { id: 'p1', ...dto };
            service.create.mockResolvedValue(result);

            expect(await controller.create(dto as any)).toBe(result);
            expect(service.create).toHaveBeenCalledWith(dto);
        });
    });

    describe('update', () => {
        it('should update a product', async () => {
            const dto = { name: 'Updated' };
            const result = { id: 'p1', ...dto };
            service.update.mockResolvedValue(result);

            expect(await controller.update('p1', dto as any)).toBe(result);
            expect(service.update).toHaveBeenCalledWith('p1', dto);
        });
    });

    describe('remove', () => {
        it('should remove a product', async () => {
            await controller.remove('p1');
            expect(service.remove).toHaveBeenCalledWith('p1');
        });
    });
});
