import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  configureApp(app);
  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}
void bootstrap();
