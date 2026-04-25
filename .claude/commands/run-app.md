Run the application locally for this NestJS e-commerce backend.

## Commands

```bash
npm run start        # production mode (dist/main)
npm run start:dev    # watch mode with hot reload (recommended)
npm run start:debug # debug mode with breakpoints
```

## Prerequisites

- PostgreSQL must be running (`docker-compose up -d postgres` or local install)
- Redis must be running (`docker-compose up -d redis` or local install)
- `.env` file must exist with `DATABASE_*` and `REDIS_*` vars set

## Verify services are running

```bash
docker ps  # should show postgres and redis containers
# OR
pg_isready -h localhost -p 5432
redis-cli ping  # should return PONG
```

## Troubleshooting

- Port 3000 in use: `lsof -i :3000` to find process, or set `PORT=3001` in `.env`
- DB connection error: check `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` in `.env`
- Redis error: check `REDIS_HOST`, `REDIS_PORT` in `.env`

## Swagger API docs

After starting, visit: http://localhost:3000/api/docs