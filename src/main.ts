import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LanguageInterceptor } from './common/interceptors/language.interceptor';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
  if (!isProduction) {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  const config = new DocumentBuilder()
    .setTitle('E-commerce Backend API')
    .setDescription(
      `
# E-Commerce Backend API

Complete REST API documentation for the e-commerce platform.

## 🔑 Authentication

Most endpoints require JWT authentication. To use protected endpoints:

1. Click the **Authorize** button (🔒) at the top
2. Enter your token as: \`Bearer your_token_here\`
3. Alternatively, use the **POST /auth/login** endpoint to get tokens

## 🔓 Public Endpoints (no auth required)

- \`POST /auth/register\` — Create account
- \`POST /auth/login\` — Get tokens
- \`POST /auth/refresh\` — Refresh tokens
- \`POST /auth/forgot-password\` — Request password reset
- \`POST /auth/reset-password\` — Reset password
- \`POST /auth/verify-email\` — Verify email
- \`GET /products\` — Browse products
- \`GET /products/:id\` — View product details
- \`GET /health\` — Health check

## 🌍 Multi-Language Support

Product names, descriptions, categories, and brands support multiple languages.
Fields use JSONB format: \`{ "en": "English", "ar": "العربية" }\`

Send \`Accept-Language\` header to get locale-specific responses.

## 📝 Roles

- \`customer\` — Default role (can manage own cart, orders, reviews)
- \`staff\` — Internal team members
- \`admin\` — Full access (manage products, orders, users)
    `.trim(),
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token as: Bearer <token>',
        in: 'header',
      },
      'JWT-AUTH',
    )
    .addServer('http://localhost:3000', 'Local Development')
    .addTag('Authentication', 'User registration, login, password management')
    .addTag('Products', 'Product catalog browsing and management')
    .addTag('Cart', 'Shopping cart operations')
    .addTag('Orders', 'Order management and tracking')
    .addTag('Users', 'User profile management')
    .addTag('Checkout', 'Cart validation and order creation')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'E-Commerce API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 3,
      docExpansion: 'list',
    },
  });

  app.useGlobalInterceptors(new LanguageInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
