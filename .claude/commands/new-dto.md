Add a new DTO (Data Transfer Object) to an existing module in this e-commerce backend.

The user will describe what DTO they need (e.g. "add a SearchProductsDto with search, filters, and pagination").

## Steps

1. **Read the module** — Check existing DTOs at `src/modules/<module>/dtos/` to match patterns.

2. **Create the DTO** at `src/modules/<module>/dtos/<name>.dto.ts`:
   - Use class-validator decorators: `@IsNotEmpty()`, `@IsOptional()`, `@IsString()`, `@IsNumber()`, `@IsEnum()`, `@IsDateString()`, `@Min()`, `@Max()`, `@IsEmail()`, `@IsUUID()`, `@IsArray()`, `@ValidateNested()`
   - Use `@Type()` from `class-transformer` for nested objects
   - Use `@ApiProperty({ required: false, example: ... })` from `@nestjs/swagger` for optional fields
   - For pagination: use `PaginationDto` from `@common/dtos/pagination.dto` — don't recreate
   - For translatable fields: use `TranslatableString` from `@common/types/translatable.type`

3. **Export the DTO** — Add to the module's barrel file or import where needed.

## Common DTO patterns

- `CreateXxxDto` — required fields only, all `@IsNotEmpty()`
- `UpdateXxxDto` — `extends PartialType(CreateXxxDto)` from `@nestjs/mapped-types`
- `SearchXxxDto` — pagination + search, sort, filter fields
- `ResponseXxxDto` — exclude sensitive fields (password, tokens)

## Don't recreate common DTOs

- `PaginationDto` — already exists at `@common/dtos/pagination.dto`
- `TranslatableString` — already exists at `@common/types/translatable.type`