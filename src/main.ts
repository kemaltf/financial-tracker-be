import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Enable cookie-parser middleware
  // we need this to access cookie from client side
  app.use(cookieParser());

  // Set up global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically remove properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('API documentation for the project')
    .setVersion('1.0')
    .addBearerAuth() // Jika menggunakan autentikasi JWT
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger UI tersedia di "/api"

  app.enableCors({
    origin: 'http://localhost:3000', // URL frontend Anda
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Jika Anda menggunakan cookies atau header otorisasi
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
