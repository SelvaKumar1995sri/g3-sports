import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RolesGuard } from './common/guards/roles.guard';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);

  app.use(helmet());

  const corsOrigin = process.env.CORS_ORIGIN ?? '*';
  if (process.env.NODE_ENV === 'production' && corsOrigin === '*') {
    console.warn('[WARN] CORS_ORIGIN is not set — defaulting to wildcard. Set CORS_ORIGIN in production!');
  }
  app.enableCors({ origin: corsOrigin });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor(), new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalGuards(new RolesGuard(reflector));

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`G3 Sports API running on port ${port}`);
}
bootstrap();
