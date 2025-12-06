---
description: How to run the e-commerce backend project
---

Follow these steps to set up and run the application locally.

## Prerequisite Services
Ensure you have the following services running locally or accessible via network:
- **PostgreSQL** (Default: localhost:5432, db: ecommerce_db)
- **Redis** (Default: localhost:6379)
- **Elasticsearch** (Optional/Default: localhost:9200)

## 1. Setup Environment Variables

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

> [!IMPORTANT]
> Edit `.env` and verify your database credentials (username, password) and Redis configuration match your local setup.

## 2. Install Dependencies

If you haven't already, install the project dependencies:

```bash
npm install
```

## 3. Database Migration

Run the TypeORM migrations to set up your database schema:

```bash
// turbo
npm run migration:run
```

## 4. Start the Application

Start the application in development mode:

```bash
// turbo
npm run start:dev
```

The server will start on port 3000 (default).
Swagger documentation is available at: [http://localhost:3000/api](http://localhost:3000/api)
