---
name: nestjs-module-generator
description: >
  Generate complete NestJS modules following this project's exact layered architecture
  with controllers, services, repositories, DTOs, entities, guards, and tests.
  Use this skill whenever the user asks to scaffold, create, add, or generate a NestJS
  module, feature, resource, CRUD, or any combination of controller/service/repository/
  entity/dto files. Also trigger when the user says things like "add a users module",
  "create a products feature", "generate CRUD for orders", or "scaffold a new module".
  Always trigger when generating any NestJS boilerplate in this codebase.
---

# NestJS Module Generator

Generates production-ready NestJS modules matching this project's exact conventions,
derived from the real source code (auth module, common/, infrastructure/).

---

## Project Conventions (Derived from Real Code)

### Path Aliases

```ts
import { BaseEntity } from '@common/entities/base.entity';
import { AbstractRepository } from '../../../common/database/abstract.repository';
// Use @common/* for common/, relative paths within the same module
```

### Folder Structure per Module

```
src/modules/<module-name>/
├── controllers/
│   └── <n>.controller.ts
├── dtos/
│   ├── create-<n>.dto.ts
│   ├── update-<n>.dto.ts
│   └── (response DTOs as needed)
├── entities/
│   ├── <n>.entity.ts
│   └── index.ts              ← re-export all entities: export * from './<n>.entity'
├── guards/                   ← only if module has its own guard
│   └── <n>.guard.ts
├── repositories/
│   └── <n>.repository.ts
├── services/
│   └── <n>.service.ts
├── tests/
│   ├── <n>.controller.spec.ts
│   └── <n>.service.spec.ts
└── <n>.module.ts
```

---

## Base Classes (Always Extend)

### BaseEntity — `src/common/entities/base.entity.ts`

```ts
// Provides: id (uuid), createdAt, updatedAt
// Does NOT have @Entity — subclasses add that
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
```

### AbstractRepository — `src/common/database/abstract.repository.ts`

Available methods (use these, don't reimplement):

- `findOne(where)` → `T | null`
- `findOneOrFail(where)` → `T` (throws EntityNotFoundError if missing)
- `findAll(options?)` → `T[]`
- `findWithPagination(page, limit, where?)` → `{ data, total, page, limit }`
- `create(data)` → `T`
- `update(id, data)` → `T`
- `softDelete(id)` → `void`
- `restore(id)` → `void`
- `permanentDelete(id)` → `void`
- `findOneWithOptions(options)` → `T | null`
- `createQueryBuilder(alias?)` → `SelectQueryBuilder<T>` (protected)

---

## Real Project Imports Reference

### Auth Guards

```ts
// Passport JWT guard — use for protected routes
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Role-based — reads @Roles() decorator metadata from request user.role
import { RolesGuard } from '@common/guards/roles.guard';

// Throttle — currently passes through (Redis throttle not wired yet)
import { ThrottleGuard } from '@common/guards/throttle.guard';
```

### Roles Decorator + UserRole Enum

```ts
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@modules/auth/entities/user.entity';
// UserRole enum: CUSTOMER = 'customer' | STAFF = 'staff' | ADMIN = 'admin'

// Usage on controller method:
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
```

### PaginationDto — `src/common/dtos/pagination.dto.ts`

```ts
// Real fields (always import from here, never recreate):
page?: number = 1;   // @IsOptional @Type(() => Number) @IsNumber @Min(1)
limit?: number = 10; // @IsOptional @Type(() => Number) @IsNumber @Min(1)
// @Type(() => Number) is required for query param coercion from strings
```

### TranslatableString — `src/common/types/translatable.type.ts`

```ts
// For multilingual fields (name, description, etc.) stored as PostgreSQL JSONB
export class TranslatableString { en: string; ar: string; }

// Entity column:
@Column({ type: 'jsonb' })
name: TranslatableString;

// LanguageInterceptor auto-transforms responses based on ?lang= or Accept-Language header
// Heuristic: detects objects with 'en' string key as translation maps
```

### SlugUtil — `src/common/utils/slug.util.ts`

```ts
import { SlugUtil } from '@common/utils/slug.util';
SlugUtil.create(str); // → lowercased, hyphenated slug
SlugUtil.generateUniqueSlug(name, repo); // → unique slug (checks DB for conflicts)
```

### Infrastructure Services (all are @Global modules — inject directly)

```ts
// Redis
import { RedisService } from '@infrastructure/cache/redis.service';
// Key methods: get<T>(key), set<T>(key, value, ttl?), delete(key), exists(key)
// Pattern:     cache<T>(key, fetchFn, ttl) — returns cached or fetches fresh
// Locks:       acquireLock(lockKey, ttl), releaseLock(lockKey, lockValue)
// Pub/Sub:     publish(channel, msg), subscribe(channel, callback)
// Scan/clean:  scan(pattern), deletePattern(pattern)

// Background Jobs
import { BullmqService } from '@infrastructure/queue/bullmq.service';
// Pre-built queues:
//   addEmailJob(name, data, opts)
//   addImageProcessingJob(name, data, opts)
//   addOrderProcessingJob(name, data, opts)   ← high priority
//   addNotificationJob(name, data, opts)
//   addAnalyticsJob(name, data, opts)         ← low priority, delayed

// Email
import { MailerService } from '@infrastructure/email/mailer.service';
// sendEmail(opts) — sync SMTP; sendEmailAsync(opts) — queued via BullMQ
// Pre-built: sendWelcomeEmail, sendOrderConfirmation, sendPasswordReset,
//            sendVerificationEmail, sendOrderShipped, sendAbandonedCartReminder
```

---

## Generation Steps

### Step 1 — Gather Requirements

Confirm before generating:

1. **Module name** (singular noun, e.g., `product`, `order`, `review`)
2. **Entity fields** — name, TypeScript type, nullable?, unique?, indexed?
3. **Translatable fields?** — use `TranslatableString` + `@Column({ type: 'jsonb' })`
4. **Slug field?** — use `SlugUtil.generateUniqueSlug` in service create()
5. **Relations** — entity, cardinality, onDelete behavior
6. **Auth** — public, JWT only, or role-restricted (which roles)?
7. **Soft delete?** — default yes: add `@DeleteDateColumn`
8. **Cache?** — inject `RedisService`, use `cache()` pattern in service
9. **Background jobs?** — inject `BullmqService`, pick appropriate queue method

### Step 2 — Generate Files in Order

1. Entity + `index.ts`
2. Repository (with custom query methods if needed)
3. DTOs (create, update, response shapes if needed)
4. Service
5. Controller
6. Module
7. Tests (controller.spec + service.spec)

### Step 3 — Validate Before Outputting

- [ ] Entity extends `BaseEntity` from `@common/entities/base.entity`
- [ ] Entity has `@DeleteDateColumn({ name: 'deleted_at', nullable: true })` if soft-deletable
- [ ] `index.ts` re-exports all entities with `export * from`
- [ ] Repository extends `AbstractRepository<EntityClass>`
- [ ] Repository constructor: `@InjectRepository(Entity)` + `super(repo)`
- [ ] DTOs use `class-validator` decorators + `@ApiProperty` from `@nestjs/swagger`
- [ ] UpdateDto: `export class UpdateDto extends PartialType(CreateDto) {}`
- [ ] `PartialType` imported from `@nestjs/mapped-types` (NOT `@nestjs/swagger`)
- [ ] Numeric query params have `@Type(() => Number)` from `class-transformer`
- [ ] Service injects only what it uses (repo + optional Redis/BullMQ/Mailer)
- [ ] Controller has `@ApiTags`, `@ApiBearerAuth`, `@UseGuards(JwtAuthGuard)`
- [ ] All `:id` params use `@Param('id', ParseUUIDPipe)` (IDs are UUID v4)
- [ ] Module has `TypeOrmModule.forFeature([Entity])` in imports array
- [ ] Module exports Service
- [ ] Tests mock all deps as `Partial<Record<keyof Dep, jest.Mock>>`

---

## Code Templates

### Entity

```ts
import { Entity, Column, ManyToOne, OneToMany, JoinColumn, DeleteDateColumn, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';
import { TranslatableString } from '@common/types/translatable.type';

@Entity('<table_name_plural_snake>')
export class <N>Entity extends BaseEntity {
  @Column({ type: 'jsonb' })
  name: TranslatableString;

  @Column({ nullable: true })
  slug?: string;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  // Example relation:
  @ManyToOne(() => OtherEntity, other => other.<ns>, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'other_id' })
  other: OtherEntity;
}
```

### index.ts

```ts
export * from './<n>.entity';
```

### Repository

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractRepository } from '../../../common/database/abstract.repository';
import { <N>Entity } from '../entities/<n>.entity';

@Injectable()
export class <N>Repository extends AbstractRepository<<N>Entity> {
  constructor(
    @InjectRepository(<N>Entity)
    private readonly <n>Repo: Repository<<N>Entity>,
  ) {
    super(<n>Repo);
  }

  // Custom query example:
  async findBySlug(slug: string): Promise<<N>Entity | null> {
    return this.findOne({ slug } as any);
  }

  // QueryBuilder example:
  async findWithRelations(): Promise<<N>Entity[]> {
    return this.createQueryBuilder('<n>')
      .leftJoinAndSelect('<n>.relation', 'relation')
      .where('<n>.deletedAt IS NULL')
      .getMany();
  }
}
```

### Create DTO

```ts
import { IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TranslatableString } from '@common/types/translatable.type';

export class Create<N>Dto {
  @ApiProperty({ example: { en: 'Name', ar: 'الاسم' } })
  @ValidateNested()
  @Type(() => TranslatableString)
  name: TranslatableString;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
```

### Update DTO

```ts
import { PartialType } from '@nestjs/mapped-types';
import { Create<N>Dto } from './create-<n>.dto';

export class Update<N>Dto extends PartialType(Create<N>Dto) {}
```

### Service

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { <N>Repository } from '../repositories/<n>.repository';
import { Create<N>Dto } from '../dtos/create-<n>.dto';
import { Update<N>Dto } from '../dtos/update-<n>.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';
// import { RedisService } from '@infrastructure/cache/redis.service';
// import { BullmqService } from '@infrastructure/queue/bullmq.service';

@Injectable()
export class <N>Service {
  constructor(
    private readonly <n>Repository: <N>Repository,
    // private readonly redisService: RedisService,
    // private readonly bullmqService: BullmqService,
  ) {}

  async create(dto: Create<N>Dto) {
    return this.<n>Repository.create(dto);
  }

  async findAll(pagination: PaginationDto) {
    return this.<n>Repository.findWithPagination(
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(id: string) {
    const item = await this.<n>Repository.findOne({ id } as any);
    if (!item) throw new NotFoundException(`<N> #${id} not found`);
    return item;
  }

  async update(id: string, dto: Update<N>Dto) {
    await this.findOne(id); // validate existence first
    return this.<n>Repository.update(id, dto as any);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.<n>Repository.softDelete(id);
    return { message: '<N> removed successfully' };
  }
}
```

### Controller

```ts
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';
import { <N>Service } from '../services/<n>.service';
import { Create<N>Dto } from '../dtos/create-<n>.dto';
import { Update<N>Dto } from '../dtos/update-<n>.dto';
import { PaginationDto } from '@common/dtos/pagination.dto';

@ApiTags('<n>s')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('<n>s')
export class <N>Controller {
  constructor(private readonly <n>Service: <N>Service) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create <n>' })
  @ApiResponse({ status: 201, description: '<N> created successfully' })
  create(@Body() dto: Create<N>Dto) {
    return this.<n>Service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all <n>s with pagination' })
  findAll(@Query() pagination: PaginationDto) {
    return this.<n>Service.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get <n> by ID' })
  @ApiResponse({ status: 404, description: '<N> not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.<n>Service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Update<N>Dto,
  ) {
    return this.<n>Service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  @ApiResponse({ status: 403, description: 'Admin only' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.<n>Service.remove(id);
  }
}
```

### Module

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { <N>Entity } from './entities/<n>.entity';
import { <N>Repository } from './repositories/<n>.repository';
import { <N>Service } from './services/<n>.service';
import { <N>Controller } from './controllers/<n>.controller';

@Module({
  imports: [TypeOrmModule.forFeature([<N>Entity])],
  controllers: [<N>Controller],
  providers: [<N>Service, <N>Repository],
  exports: [<N>Service],
})
export class <N>Module {}
```

### Test — Service Spec (mirrors auth pattern)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { <N>Service } from '../services/<n>.service';
import { <N>Repository } from '../repositories/<n>.repository';

describe('<N>Service', () => {
  let service: <N>Service;
  let repository: Partial<Record<keyof <N>Repository, jest.Mock>>;

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      findWithPagination: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        <N>Service,
        { provide: <N>Repository, useValue: repository },
      ],
    }).compile();

    service = module.get<<N>Service>(<N>Service);
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('findOne', () => {
    it('should throw NotFoundException when not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('some-uuid')).rejects.toThrow(NotFoundException);
    });

    it('should return entity when found', async () => {
      const entity = { id: 'uuid', name: { en: 'Test', ar: 'تست' } };
      repository.findOne.mockResolvedValue(entity);
      const result = await service.findOne('uuid');
      expect(result).toEqual(entity);
    });
  });
});
```

### Test — Controller Spec (mirrors auth pattern)

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { <N>Controller } from '../controllers/<n>.controller';
import { <N>Service } from '../services/<n>.service';

describe('<N>Controller', () => {
  let controller: <N>Controller;
  let service: Partial<Record<keyof <N>Service, jest.Mock>>;

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [<N>Controller],
      providers: [{ provide: <N>Service, useValue: service }],
    }).compile();

    controller = module.get<<N>Controller>(<N>Controller);
  });

  it('should be defined', () => expect(controller).toBeDefined());
});
```

---

## Admin Module Pattern (for `modules/admin/`)

When generating under `admin/`, follow the existing admin structure:

- Apply `AdminGuard` at controller level instead of `JwtAuthGuard`
- Inject `AuditLogRepository` in service, log all mutations:
  ```ts
  await this.auditLogRepo.create({
    userId: currentUser.id,
    action: 'UPDATE_<N>',
    entityType: '<N>',
    entityId: id,
    metadata: { changes: dto },
  });
  ```
- Follow the naming pattern: `analytics.service.ts`, `dashboard.service.ts`, `staff.service.ts`
- Register entities in the admin module's `TypeOrmModule.forFeature([])`

---

## Common Pitfalls

- **Don't** use `findOne({ id })` without `as any` — TypeORM FindOptionsWhere needs casting
- **Don't** skip `@Type(() => Number)` on numeric query params — string coercion fails without it
- **Don't** add `@Entity` to `BaseEntity` itself — only subclasses get the decorator
- **Don't** use `PartialType` from `@nestjs/swagger` — it breaks validation; use `@nestjs/mapped-types`
- **Do** add `@DeleteDateColumn` to entity when using `softDelete()` from AbstractRepository
- **Do** note `database.config.ts` auto-loads entities from `modules/**/entities/*.entity{.ts,.js}`
- **Do** always run `await this.findOne(id)` before update/delete to get a proper 404 response
