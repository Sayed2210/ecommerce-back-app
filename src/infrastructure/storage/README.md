# Storage (AWS S3)

File upload and management via AWS S3. Global module — available everywhere without explicit import.

## Responsibilities

- Upload files (product images, avatars, review images) to S3
- Delete files when products/reviews are removed
- Generate pre-signed URLs for private file access
- Check file existence

## Configuration

| Env Variable | Description |
|-------------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_S3_BUCKET` | S3 bucket name |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |

## `S3Service` API

### `uploadFile(key, body, contentType)`
Uploads a `Buffer` to S3 at the given key.
Returns the public URL: `https://{bucket}.s3.{region}.amazonaws.com/{key}`

### `deleteFile(key)`
Deletes the object at the given key.

### `getSignedUrl(key, expiresIn?)`
Returns a pre-signed URL for temporary private access. Default TTL: 3600 seconds.

### `fileExists(key)`
Returns `true` if the key exists in the bucket.

### `buildKey(folder, resourceId, filename)`
Generates a canonical S3 key:
```
products/abc-123/550e8400-e29b-41d4-a716-446655440000.jpg
avatars/user-id/550e8400-e29b-41d4-a716-446655440000.png
```

## Key Naming Convention

| Resource | Key Pattern |
|----------|-------------|
| Product images | `products/{productId}/{uuid}.{ext}` |
| User avatars | `avatars/{userId}/{uuid}.{ext}` |
| Review images | `reviews/{reviewId}/{uuid}.{ext}` |

## Usage Example

```typescript
// In a controller that accepts file upload:
@Post(':id/image')
@UseInterceptors(FileInterceptor('file'))
async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
  const key = this.s3Service.buildKey('products', id, file.originalname);
  const url = await this.s3Service.uploadFile(key, file.buffer, file.mimetype);
  return { url };
}
```
