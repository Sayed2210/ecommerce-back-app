#!/bin/bash

# NestJS E-Commerce Backend - Clean Architecture Folder Structure Generator
# Run this script in your project root directory

set -e

echo "🚀 Creating NestJS Clean Architecture folder structure..."

# Create root directories
mkdir -p src/config src/common/{decorators,filters,guards,interceptors,middleware,pipes,dtos,utils} \
         src/modules src/infrastructure/{database/{migrations,seeds,factories},cache,queue,storage,email} \
         src/tests/{integration,e2e}

# Create root files
touch src/app.module.ts src/main.ts

# Create config files
touch src/config/{database.config.ts,jwt.config.ts,stripe.config.ts,validation.config.ts}

# Create common files
touch src/common/decorators/{roles.decorator.ts,public.decorator.ts}
touch src/common/filters/{http-exception.filter.ts,ws-exception.filter.ts}
touch src/common/guards/{jwt.guard.ts,roles.guard.ts,throttle.guard.ts}
touch src/common/interceptors/{transform.interceptor.ts,cache.interceptor.ts,logging.interceptor.ts}
touch src/common/middleware/{logger.middleware.ts,cors.middleware.ts,security.middleware.ts}
touch src/common/pipes/{validation.pipe.ts,file-validation.pipe.ts}
touch src/common/dtos/{pagination.dto.ts,response.dto.ts}
touch src/common/utils/{slug.util.ts,date.util.ts,encryption.util.ts}

# Create infrastructure files
touch src/infrastructure/cache/redis.service.ts
touch src/infrastructure/queue/bullmq.service.ts
touch src/infrastructure/storage/s3.service.ts
touch src/infrastructure/email/mailer.service.ts

# Module: Auth
mkdir -p src/modules/auth/{controllers,services,repositories,strategies,guards,dtos,entities,tests}
touch src/modules/auth/auth.module.ts
touch src/modules/auth/controllers/{auth.controller.ts,oauth.controller.ts}
touch src/modules/auth/services/{auth.service.ts,jwt.service.ts,password.service.ts,oauth.service.ts}
touch src/modules/auth/repositories/user.repository.ts
touch src/modules/auth/strategies/{jwt.strategy.ts,jwt-refresh.strategy.ts,oauth.strategy.ts}
touch src/modules/auth/guards/oauth.guard.ts
touch src/modules/auth/dtos/{login.dto.ts,register.dto.ts,refresh-token.dto.ts,forgot-password.dto.ts,reset-password.dto.ts}
touch src/modules/auth/entities/{user.entity.ts,refresh-token.entity.ts,oauth-provider.entity.ts}
touch src/modules/auth/tests/{auth.service.spec.ts,auth.controller.spec.ts}

# Module: Users
mkdir -p src/modules/users/{controllers,services,repositories,dtos,entities,tests}
touch src/modules/users/users.module.ts
touch src/modules/users/controllers/{users.controller.ts,addresses.controller.ts}
touch src/modules/users/services/{users.service.ts,addresses.service.ts,wishlist.service.ts,notifications.service.ts}
touch src/modules/users/repositories/{user.repository.ts,address.repository.ts,wishlist.repository.ts}
touch src/modules/users/dtos/{update-profile.dto.ts,address.dto.ts,wishlist.dto.ts}
touch src/modules/users/entities/{user.entity.ts,address.entity.ts,wishlist.entity.ts,notification.entity.ts}
touch src/modules/users/tests/users.service.spec.ts

# Module: Products
mkdir -p src/modules/products/{controllers,services,repositories,dtos,entities,tests}
touch src/modules/products/products.module.ts
touch src/modules/products/controllers/{products.controller.ts,categories.controller.ts,brands.controller.ts}
touch src/modules/products/services/{products.service.ts,categories.service.ts,brands.service.ts,variants.service.ts,inventory.service.ts}
touch src/modules/products/repositories/{product.repository.ts,category.repository.ts,brand.repository.ts,variant.repository.ts}
touch src/modules/products/dtos/{create-product.dto.ts,update-product.dto.ts,category.dto.ts,brand.dto.ts,variant.dto.ts,filter.dto.ts}
touch src/modules/products/entities/{product.entity.ts,category.entity.ts,brand.entity.ts,product-variant.entity.ts,product-image.entity.ts,inventory-log.entity.ts}
touch src/modules/products/tests/products.service.spec.ts

# Module: Cart
mkdir -p src/modules/cart/{controllers,services,repositories,dtos,entities,tests}
touch src/modules/cart/cart.module.ts
touch src/modules/cart/controllers/cart.controller.ts
touch src/modules/cart/services/cart.service.ts
touch src/modules/cart/repositories/cart.repository.ts
touch src/modules/cart/dtos/{add-cart-item.dto.ts,update-cart-item.dto.ts}
touch src/modules/cart/entities/{cart.entity.ts,cart-item.entity.ts}
touch src/modules/cart/tests/cart.service.spec.ts

# Module: Orders
mkdir -p src/modules/orders/{controllers,services,repositories,dtos,entities,tests}
touch src/modules/orders/orders.module.ts
touch src/modules/orders/controllers/{orders.controller.ts,checkout.controller.ts}
touch src/modules/orders/services/{orders.service.ts,checkout.service.ts,payment.service.ts,shipping.service.ts}
touch src/modules/orders/repositories/{order.repository.ts,coupon.repository.ts}
touch src/modules/orders/dtos/{create-order.dto.ts,order-status.dto.ts,apply-coupon.dto.ts,payment.dto.ts}
touch src/modules/orders/entities/{order.entity.ts,order-item.entity.ts,coupon.entity.ts,payment.entity.ts,shipping.entity.ts}
touch src/modules/orders/tests/orders.service.spec.ts

# Module: Admin
mkdir -p src/modules/admin/{controllers,services,repositories,dtos,entities,guards}
touch src/modules/admin/admin.module.ts
touch src/modules/admin/controllers/{dashboard.controller.ts,staff.controller.ts,analytics.controller.ts}
touch src/modules/admin/services/{dashboard.service.ts,staff.service.ts,analytics.service.ts}
touch src/modules/admin/repositories/audit-log.repository.ts
touch src/modules/admin/dtos/{dashboard-stats.dto.ts,create-staff.dto.ts,audit-log.dto.ts}
touch src/modules/admin/entities/{staff.entity.ts,audit-log.entity.ts}
touch src/modules/admin/guards/admin.guard.ts

# Module: Reviews
mkdir -p src/modules/reviews/{controllers,services,repositories,dtos,entities}
touch src/modules/reviews/reviews.module.ts
touch src/modules/reviews/controllers/reviews.controller.ts
touch src/modules/reviews/services/reviews.service.ts
touch src/modules/reviews/repositories/review.repository.ts
touch src/modules/reviews/dtos/{create-review.dto.ts,update-review.dto.ts}
touch src/modules/reviews/entities/{review.entity.ts,review-image.entity.ts}

# Module: Notifications
mkdir -p src/modules/notifications/{controllers,services,entities,dto}
touch src/modules/notifications/notifications.module.ts
touch src/modules/notifications/controllers/notifications.controller.ts
touch src/modules/notifications/services/{notification.service.ts,websocket.gateway.ts}
touch src/modules/notifications/entities/notification.entity.ts
touch src/modules/notifications/dto/notification.dto.ts

# Module: Search
mkdir -p src/modules/search/{controllers,services,dtos}
touch src/modules/search/search.module.ts
touch src/modules/search/controllers/search.controller.ts
touch src/modules/search/services/{search.service.ts,elasticsearch.service.ts}
touch src/modules/search/dtos/search.dto.ts

# Create test placeholders
touch src/tests/integration/.gitkeep
touch src/tests/e2e/.gitkeep

# Create package.json template
cat > package.json << 'EOF'
{
  "name": "ecommerce-backend",
  "version": "1.0.0",
  "author": "Your Name",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "typeorm": "ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js",
    "migration:generate": "npm run typeorm -- migration:generate -d ormconfig.ts",
    "migration:run": "npm run typeorm -- migration:run -d ormconfig.ts"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.1.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "bcrypt": "^5.1.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "pg": "^8.11.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0",
    "typeorm": "^0.3.17",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.0"
  }
}
EOF

# Create tsconfig.json template
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@config/*": ["src/config/*"],
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
      "@infrastructure/*": ["src/infrastructure/*"]
    }
  }
}
EOF

# Create .env.example
cat > .env.example << 'EOF'
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=ecommerce_db

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM=noreply@yourstore.com

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_API_KEY=your_api_key
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Environment variables
.env
.env.local
.env.production

# Database
*.sqlite
*.db

# Uploads
/uploads
/tmp
EOF

echo "✅ Folder structure created successfully!"
echo ""
echo "📁 Project structure:"
tree -L 3 src/ --dirsfirst

echo ""
echo "📝 Next steps:"
echo "1. Run: npm install"
echo "2. Copy .env.example to .env and configure"
echo "3. Run: npm run start:dev"
echo "4. Start building your e-commerce empire!"