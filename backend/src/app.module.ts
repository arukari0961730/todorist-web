import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { TeamsModule } from './teams/teams.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { ChatModule } from './chat/chat.module';
import { PullRequestsModule } from './pull-requests/pull-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), '..', 'frontend', 'dist'),
      exclude: ['/api', '/api/{*path}'],
    }),
    PrismaModule,
    AuthModule,
    TeamsModule,
    TasksModule,
    CommentsModule,
    ChatModule,
    PullRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
