import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []),
];

function corsOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  // Allow requests with no origin (mobile apps, server-to-server, curl)
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  // Allow any Vercel preview deployment
  if (origin.endsWith('.vercel.app')) return callback(null, true);
  callback(new Error('Not allowed by CORS'), false);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — allow frontend with proper origin validation
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`\n🚀 resPOS API running on http://localhost:${port}/api/v1`);
}
bootstrap();
