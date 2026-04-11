Scaffold a complete NestJS feature module for this e-commerce backend.

The user will provide a module name (e.g. "coupons", "shipping", "promotions"). Use that name to generate all files.

## Conventions to follow exactly

- All entities extend `BaseEntity` from `@common/entities/base.entity` (gives `id` UUID, `createdAt`, `updatedAt`)
- All repositories extend `AbstractRepository<Entity>` from `@common/database/abstract.repository`
- Repository constructor injects `@InjectRepository(Entity) private readonly repo: Repository<Entity>` and calls `super(repo)`
- Services inject `RedisService` from `@infrastructure/cache/redis.service` for caching where appropriate
- Controllers use `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`, `@ApiBody` from `@nestjs/swagger` on every endpoint
- Protected endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` + `@ApiBearerAuth()`
- Use `@common/*` and `@modules/*` path aliases in imports, never relative `../../../`
- Multi-language text fields (name, description) are stored as `Record<string, any>` with `type: 'jsonb'`

## Files to create

Given module name `<name>` (use PascalCase for classes, kebab-case for filenames, camelCase for variables):

1. `src/modules/<name>/entities/<name>.entity.ts` — TypeORM entity extending BaseEntity
2. `src/modules/<name>/repositories/<name>.repository.ts` — Repository extending AbstractRepository
3. `src/modules/<name>/dtos/create-<name>.dto.ts` — CreateDto with class-validator decorators
4. `src/modules/<name>/dtos/update-<name>.dto.ts` — UpdateDto using `PartialType(CreateDto)` from `@nestjs/mapped-types`
5. `src/modules/<name>/services/<name>.service.ts` — Service with full CRUD (create, findAll, findOne, update, remove); cache with RedisService using key prefix `<name>:`
6. `src/modules/<name>/controllers/<name>.controller.ts` — Controller with GET (list), GET :id, POST, PATCH :id, DELETE :id; admin-only for write operations
7. `src/modules/<name>/tests/<name>.service.spec.ts` — Unit test file using `@nestjs/testing` with mocked repository and service, matching the pattern in `src/modules/auth/tests/auth.service.spec.ts`
8. `src/modules/<name>/<name>.module.ts` — Module wiring TypeOrmModule.forFeature, providers, controllers, exports

## After creating files

Tell the user they must manually import the new module into `src/app.module.ts` under the Feature Modules section.

Ask the user if they want you to add the module import to `app.module.ts` for them.
