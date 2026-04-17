import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { S3Service } from '@infrastructure/storage/s3.service';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { UploadImageDto } from '../dtos/upload-image.dto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class ProductImagesService {
    private readonly logger = new Logger(ProductImagesService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
        @InjectRepository(ProductImage)
        private readonly imageRepo: Repository<ProductImage>,
        private readonly s3: S3Service,
        private readonly dataSource: DataSource,
    ) {}

    async upload(
        productId: string,
        file: Express.Multer.File,
        dto: UploadImageDto,
    ): Promise<ProductImage> {
        this.validateFile(file);

        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) throw new NotFoundException('Product not found');

        const key = this.s3.buildKey('products', productId, file.originalname);
        const url = await this.s3.uploadFile(key, file.buffer, file.mimetype);

        const existingCount = await this.imageRepo.count({ where: { product: { id: productId } } });

        const image = this.imageRepo.create({
            url,
            altText: dto.altText,
            displayOrder: dto.displayOrder ?? existingCount,
            isPrimary: existingCount === 0, // first upload is automatically primary
            product: { id: productId },
            variant: dto.variantId ? { id: dto.variantId } : undefined,
        });

        const saved = await this.imageRepo.save(image);
        this.logger.log(`Uploaded image ${saved.id} for product ${productId}`);
        return saved;
    }

    async remove(productId: string, imageId: string): Promise<void> {
        const image = await this.imageRepo.findOne({
            where: { id: imageId, product: { id: productId } },
        });
        if (!image) throw new NotFoundException('Image not found');

        // Extract S3 key from the stored URL
        const key = this.extractS3Key(image.url);
        await this.s3.deleteFile(key);

        await this.imageRepo.remove(image);

        // If the deleted image was primary, promote the next image
        if (image.isPrimary) {
            const next = await this.imageRepo.findOne({
                where: { product: { id: productId } },
                order: { displayOrder: 'ASC' },
            });
            if (next) await this.imageRepo.update(next.id, { isPrimary: true });
        }

        this.logger.log(`Deleted image ${imageId} from product ${productId}`);
    }

    async setPrimary(productId: string, imageId: string): Promise<ProductImage> {
        const image = await this.imageRepo.findOne({
            where: { id: imageId, product: { id: productId } },
        });
        if (!image) throw new NotFoundException('Image not found');

        await this.dataSource.transaction(async (manager) => {
            // Clear existing primary flag
            await manager.update(
                ProductImage,
                { product: { id: productId } },
                { isPrimary: false },
            );
            // Set the new primary
            await manager.update(ProductImage, { id: imageId }, { isPrimary: true });
        });

        return { ...image, isPrimary: true };
    }

    async findAll(productId: string): Promise<ProductImage[]> {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) throw new NotFoundException('Product not found');

        return this.imageRepo.find({
            where: { product: { id: productId } },
            order: { displayOrder: 'ASC', createdAt: 'ASC' },
        });
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private validateFile(file: Express.Multer.File): void {
        if (!file) throw new BadRequestException('No file provided');

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
                `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: 5 MB`,
            );
        }
    }

    private extractS3Key(url: string): string {
        // URL format: https://{bucket}.s3.{region}.amazonaws.com/{key}
        const parts = url.split('.amazonaws.com/');
        if (parts.length < 2) throw new BadRequestException('Cannot extract S3 key from URL');
        return parts[1];
    }
}
