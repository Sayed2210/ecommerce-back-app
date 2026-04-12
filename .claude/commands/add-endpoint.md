Add a new HTTP endpoint to an existing controller in this e-commerce backend.

The user will describe what endpoint they want (e.g. "add a GET /products/:id/related endpoint to the products controller").

## Steps

1. **Read the controller** — Read the target controller file first. Do not add anything without reading the current code.

2. **Read the service** — Read the corresponding service file to understand what methods already exist.

3. **Add the service method** if it doesn't exist yet (follow the existing service patterns: check Redis cache first, throw `NotFoundException` if entity not found, invalidate cache on mutations).

4. **Add the controller endpoint** following these rules exactly:
   - Decorator order: `@Get/@Post/@Patch/@Delete`, `@UseGuards(...)` (if protected), `@Roles(...)` (if role-locked), `@ApiBearerAuth()` (if protected), `@HttpCode(...)` (only if not 200), then Swagger decorators (`@ApiOperation`, `@ApiParam`, `@ApiQuery`, `@ApiBody`, `@ApiResponse`)
   - Every endpoint needs at minimum `@ApiOperation({ summary, description })` and at least one `@ApiResponse`
   - Admin-only write endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)`
   - Public read endpoints: no guards needed (JWT guard is NOT global in this project)
   - DELETE endpoints that return nothing: `@HttpCode(HttpStatus.NO_CONTENT)`

5. **Do not** add duplicate routes, change existing method signatures, or modify unrelated code.
