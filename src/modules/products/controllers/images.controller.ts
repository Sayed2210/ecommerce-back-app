import {
    Controller,
    Get,
    Post,
    Delete,
    Patch,
    Param,
    Body,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    HttpCode,
    HttpStatus,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiParam,
    ApiConsumes,
} from '@nestjs/swagger';
import { ProductImagesService } from '../services/images.service';
import { UploadImageDto } from '../dtos/upload-image.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/auth/entities/user.entity';

@ApiTags('Product Images')
@ApiBearerAuth()
@Controller('products/:productId/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ProductImagesController {
    constructor(private readonly imagesService: ProductImagesService) {}

    @Get()
    @ApiOperation({ summary: 'List product images', description: 'Get all images for a product ordered by displayOrder' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiResponse({ status: 200, description: 'Images retrieved' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async findAll(@Param('productId') productId: string) {
        return this.imagesService.findAll(productId);
    }

    @Post()
    @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Upload product image', description: 'Upload a product image to S3 (JPEG, PNG, WebP — max 5 MB)' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiResponse({ status: 201, description: 'Image uploaded' })
    @ApiResponse({ status: 400, description: 'Invalid file type or size' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    @HttpCode(HttpStatus.CREATED)
    async upload(
        @Param('productId') productId: string,
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
                    new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
                ],
            }),
        )
        file: Express.Multer.File,
        @Body() dto: UploadImageDto,
    ) {
        return this.imagesService.upload(productId, file, dto);
    }

    @Delete(':imageId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete product image', description: 'Delete an image from S3 and the database' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiParam({ name: 'imageId', description: 'Image ID' })
    @ApiResponse({ status: 204, description: 'Image deleted' })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async remove(
        @Param('productId') productId: string,
        @Param('imageId') imageId: string,
    ) {
        await this.imagesService.remove(productId, imageId);
    }

    @Patch(':imageId/primary')
    @ApiOperation({ summary: 'Set primary image', description: 'Mark an image as the primary product image' })
    @ApiParam({ name: 'productId', description: 'Product ID' })
    @ApiParam({ name: 'imageId', description: 'Image ID' })
    @ApiResponse({ status: 200, description: 'Primary image updated' })
    @ApiResponse({ status: 404, description: 'Image not found' })
    async setPrimary(
        @Param('productId') productId: string,
        @Param('imageId') imageId: string,
    ) {
        return this.imagesService.setPrimary(productId, imageId);
    }
}
