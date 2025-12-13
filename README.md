# E-Commerce Backend Application

A robust, scalable e-commerce backend built with [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/), and [PostgreSQL](https://www.postgresql.org/). This application supports multi-language content, user authentication, product management, shopping cart functionality, and order processing.

## 🚀 Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL (with TypeORM)
- **Caching**: Redis
- **Authentication**: JWT (JSON Web Tokens) & Passport
- **Documentation**: Swagger (OpenAPI)
- **Validation**: class-validator & class-transformer

## 🛠️ Getting Started

### Prerequisites

- Node.js (v16+)
- PostgreSQL
- Redis

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd ecommerce-back-app
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Configure environment variables:
    Create a `.env` file in the root directory with the following variables:

    ```env
    # Database
    DB_HOST=localhost
    DB_PORT=5432
    DB_USERNAME=postgres
    DB_PASSWORD=postgres
    DB_DATABASE=ecommerce_db

    # JWT
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRES_IN=1d
    JWT_REFRESH_SECRET=your_refresh_secret
    JWT_REFRESH_EXPIRES_IN=7d

    # Redis
    REDIS_HOST=localhost
    REDIS_PORT=6379

    # App
    PORT=3000
    FRONTEND_URL=http://localhost:8080
    ```

4.  Run database migrations:
    ```bash
    npm run migration:run
    ```

### Running the Application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

### Running Tests

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e
```

## 📚 API Documentation

The application provides a full Swagger UI documentation.
Once the server is running, visit:

**[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

## 🧩 Modules & Endpoints Overview

### 🔐 Authentication (`/auth`)

- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Authenticate user and get tokens.
- `POST /auth/refresh`: Refresh access token.
- `POST /auth/forgot-password`: Request password reset email.
- `POST /auth/reset-password`: Reset password using token.
- `POST /auth/logout`: Logout and revoke refresh token.

### 👤 Users (`/users`)

- `GET /users/me`: Get current user profile.
- `PATCH /users/me`: Update current user profile.
- `GET /users/me/wishlist`: Get current user's wishlist.
- `GET /users`: Get all users (Admin only).
- `GET /users/:id`: Get user by ID (Admin only).
- `DELETE /users/:id`: Delete user (Admin only).

### 📦 Products (`/products`)

- `GET /products`: List products with filtering and pagination.
- `GET /products/:id`: Get product details.
- `POST /products`: Create product (Admin only).
- `PATCH /products/:id`: Update product (Admin only).
- `DELETE /products/:id`: Delete product (Admin only).

### 🛒 Cart (`/cart`)

- `GET /cart`: Get current user's cart.
- `POST /cart/items`: Add item to cart.
- `PATCH /cart/items/:id`: Update item quantity.
- `DELETE /cart/items/:id`: Remove item from cart.
- `DELETE /cart`: Clear cart.

### 📦 Orders (`/orders`)

- `GET /orders`: Get user orders.
- `GET /orders/:id`: Get order details.
- `PATCH /orders/:id/status`: Update order status (Admin only).
- `GET /orders/analytics/summary`: Get order analytics.

### 💳 Checkout (`/checkout`)

- `POST /checkout/validate`: Validate cart before checkout.
- `POST /checkout/create-order`: Create order from cart.
- `POST /checkout/apply-coupon`: Apply discount coupon.

## 🗄️ Key Entities

### Product

Supports multi-language content for global reach.

- `name`: `TranslatableString` (JSONB: `{ "en": "...", "ar": "..." }`)
- `description`: `TranslatableString` (JSONB)
- `basePrice`: Decimal
- `category`: Relation to Category
- `brand`: Relation to Brand
- `variants`: Relation to ProductVariant

### User

- `email`: Unique email address
- `password`: Hashed password
- `roles`: `UserRole` (ADMIN, CUSTOMER)

### Order

- `user`: Relation to User
- `items`: List of ordered products
- `total`: Final amount
- `status`: `OrderStatus` (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

## 📨 Data Transfer Objects (DTOs)

### Multi-Language Support

For fields like `name` and `description` in Products, Categories, and Brands, the API expects a `TranslatableString` object:

```typescript
export class TranslatableString {
  en: string;
  ar: string;
}
```

### CreateProductDto

```json
{
  "name": { "en": "Product Name", "ar": "اسم المنتج" },
  "description": { "en": "Description", "ar": "وصف" },
  "basePrice": 100.0,
  "categoryId": "uuid",
  "brandId": "uuid",
  "images": ["url1", "url2"]
}
```

### CreateOrderDto

```json
{
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethod": "CREDIT_CARD"
}
```

## 📄 License

This project is [MIT licensed](LICENSE).
