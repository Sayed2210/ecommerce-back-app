import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LanguageInterceptor } from './common/interceptors/language.interceptor';
import helmet from 'helmet';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean) as string[];
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
    .setDescription('The E-commerce Backend API description')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalInterceptors(new LanguageInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
