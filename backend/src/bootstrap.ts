import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser(config.getOrThrow<string>('SESSION_SECRET')));
  const frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
  if (frontendUrl !== 'same-origin') {
    app.enableCors({
      origin: frontendUrl,
      credentials: true,
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
  if (config.get<string>('NODE_ENV') === 'production') {
    const expressApp = app.getHttpAdapter().getInstance() as {
      set(name: string, value: number): void;
    };
    expressApp.set('trust proxy', 1);
  }
}
