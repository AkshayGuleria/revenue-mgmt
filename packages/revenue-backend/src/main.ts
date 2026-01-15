import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  app.enableCors();

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Revenue Management API')
    .setDescription('B2B Enterprise billing system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      filter: true, // Enable search/filter box
      showRequestDuration: true, // Show request duration
      persistAuthorization: true, // Persist authorization data
      displayOperationId: false, // Hide operation IDs
      tryItOutEnabled: true, // Enable "Try it out" by default
    },
  });

  const port = process.env.PORT || 5177;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Revenue Backend running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
