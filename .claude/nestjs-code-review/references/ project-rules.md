# Project Rules Reference

Enforced conventions derived from the actual codebase. These are non-negotiable in reviews.

---

## Entities

```ts
// ✅ CORRECT
@Entity('table_name')                          // snake_case plural
export class ProductEntity extends BaseEntity { // extends BaseEntity always
  @Column({ type: 'jsonb' })
  name: TranslatableString;                    // multilingual fields = jsonb

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;                            // required if softDelete() is used

  @ManyToOne(() => Other, o => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'other_id' })
  other: Other;                                // always @JoinColumn with name
}

// ❌ WRONG
export class ProductEntity {                   // missing BaseEntity
  name: string;                                // should be TranslatableString
  // missing deletedAt but using softDelete()
}
```

**Rules:**
- Always extend `BaseEntity` — never redefine `id`, `createdAt`, `updatedAt`
- All `name`, `description`, `title`, `seoTitle`, `seoDescription` fields → `TranslatableString` + `jsonb`
- All soft-deletable entities must have `@DeleteDateColumn`
- All `@ManyToOne` relations must specify `onDelete` and use `@JoinColumn({ name: '...' })`
- Column names → `snake_case` via `{ name: 'column_name' }`

---

## Repositories

```ts
// ✅ CORRECT
@Injectable()
export class ProductRepository extends AbstractRepository<ProductEntity> {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {
    super(productRepo);   // must call super
  }
}

// ❌ WRONG — injecting TypeORM Repository directly into a service
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)           // wrong — use the custom repository
    private readonly repo: Repository<ProductEntity>,
  ) {}
}
```

**Rules:**
- Services must inject the custom `*Repository` class, never raw `Repository<Entity>`
- Exception: `TokenService` injects `Repository<RefreshToken>` directly — this is the only valid exception
- Custom queries → use `this.createQueryBuilder()` (protected method from AbstractRepository)
- Never call `this.repository.query()` with raw SQL strings built from user input

---

## Services

```ts
// ✅ CORRECT
async findOne(id: string) {
  const item = await this.productRepo.findOne({ id } as any);
  if (!item) throw new NotFoundException(`Product #${id} not found`);
  return item;
}

async update(id: string, dto: UpdateProductDto) {
  await this.findOne(id);                     // always validate existence first
  return this.productRepo.update(id, dto as any);
}

async remove(id: string) {
  await this.findOne(id);
  await this.productRepo.softDelete(id);
  return { message: 'Product removed successfully' };
}

// ❌ WRONG
async update(id: string, dto: UpdateProductDto) {
  return this.productRepo.update(id, dto);   // no existence check — silent fail
}
```

**Rules:**
- Always validate existence with `findOne()` before `update()` or `softDelete()`
- Throw `NotFoundException` with descriptive message: `Entity #${id} not found`
- Use `Logger` not `console.log`: `private readonly logger = new Logger(MyService.name)`
- Return a plain object `{ message: '...' }` from `remove()` — don't return void

---

## Controllers

```ts
// ✅ CORRECT
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductController {

  @Post()
  @HttpCode(HttpStatus.CREATED)             // explicit status code
  create(@Body() dto: CreateProductDto) {}

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {}  // always ParseUUIDPipe

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)                    // role restriction at method level
  remove(@Param('id', ParseUUIDPipe) id: string) {}
}

// ❌ WRONG
@Controller('products')                     // missing guards, ApiTags, ApiBearerAuth
export class ProductController {
  @Get(':id')
  findOne(@Param('id') id: string) {}      // missing ParseUUIDPipe
}
```

**Rules:**
- Every protected controller → `@UseGuards(JwtAuthGuard)` at class level
- Every controller → `@ApiTags(...)` and `@ApiBearerAuth()`
- Every `:id` param → `@Param('id', ParseUUIDPipe)`
- POST endpoints → `@HttpCode(HttpStatus.CREATED)`
- Admin-only endpoints → `@Roles(UserRole.ADMIN)` + `@UseGuards(RolesGuard)` at method level
- No business logic in controllers — delegate everything to service

---

## DTOs

```ts
// ✅ CORRECT
export class CreateProductDto {
  @ApiProperty({ example: { en: 'Phone', ar: 'هاتف' } })
  @ValidateNested()
  @Type(() => TranslatableString)
  name: TranslatableString;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
// PartialType from '@nestjs/mapped-types' — NOT '@nestjs/swagger'

// For query params with numbers:
@IsOptional()
@Type(() => Number)              // required for string→number coercion from query
@IsNumber()
@Min(1)
page?: number = 1;

// ❌ WRONG
export class UpdateProductDto extends PartialType(CreateProductDto) {}
// if PartialType is from @nestjs/swagger — breaks class-validator
```

**Rules:**
- `PartialType` → always from `@nestjs/mapped-types`
- `TranslatableString` fields → `@ValidateNested()` + `@Type(() => TranslatableString)`
- Numeric query params → `@Type(() => Number)` (from `class-transformer`)
- All optional fields → `@IsOptional()` explicitly
- All DTOs → `@ApiProperty` / `@ApiPropertyOptional` for Swagger

---

## Modules

```ts
// ✅ CORRECT
@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository],
  exports: [ProductService],              // export service for cross-module use
})
export class ProductModule {}

// ❌ WRONG — missing TypeOrmModule, not exporting service
@Module({
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
```

**Rules:**
- Always `TypeOrmModule.forFeature([...entities])` — entities are not globally registered
- Always `exports: [Service]` — other modules will need it
- Never export Repository directly — only Service

---

## Authentication & Authorization

```ts
// Guards in this project:
// JwtAuthGuard  → src/modules/auth/guards/jwt-auth.guard.ts  (extends AuthGuard('jwt'))
// RolesGuard    → src/common/guards/roles.guard.ts
// ThrottleGuard → src/common/guards/throttle.guard.ts (currently pass-through)

// Correct import path:
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';   // ✅
import { JwtGuard } from 'common/guards/jwt.guard';                // ❌ wrong file

// UserRole enum source of truth:
import { UserRole } from '@modules/auth/entities/user.entity';
// Values: CUSTOMER = 'customer' | STAFF = 'staff' | ADMIN = 'admin'
```

---

## Infrastructure Usage

```ts
// ✅ Inject via constructor — these are @Global() modules
constructor(
  private readonly redisService: RedisService,
  private readonly bullmqService: BullmqService,
  private readonly mailerService: MailerService,
) {}

// ✅ Cache pattern
const data = await this.redisService.cache(
  `product:${id}`,
  () => this.productRepo.findOne({ id }),
  300, // TTL seconds
);

// ✅ Queue pattern
await this.bullmqService.addNotificationJob('notify-user', { userId, message });

// ❌ WRONG — instantiating services directly
const redis = new Redis({ host: 'localhost' });   // bypass injected RedisService
```

---

## Logging

```ts
// ✅ CORRECT — NestJS Logger
@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  async create(dto: CreateProductDto) {
    this.logger.log(`Creating product: ${dto.name.en}`);
    this.logger.error(`Failed to create: ${error.message}`, error.stack);
  }
}

// ❌ WRONG
console.log('Creating product');    // no context, no log level, stripped in prod
console.error(error);
```

---

## Testing Standards

```ts
// ✅ Follow the auth module test pattern:
describe('ProductService', () => {
  let service: ProductService;
  let repository: Partial<Record<keyof ProductRepository, jest.Mock>>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: ProductRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  // Test behavior, not implementation:
  it('should throw NotFoundException when product not found', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException);
  });
});
```

**Rules:**
- Mock with `Partial<Record<keyof Dep, jest.Mock>>` pattern
- Always test the negative paths (404, 409, 401 scenarios)
- Use `{ provide: DepClass, useValue: mockObj }` — never `jest.mock()` entire modules
- Test names → `'should <behavior> when <condition>'`