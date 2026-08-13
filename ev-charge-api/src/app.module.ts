import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StationsModule } from './modules/stations/stations.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ChatModule } from './modules/chat/chat.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Pino logging (built-in standard formatting)
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),

    // Rate limiting (global: 100 req / 60s)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Infrastructure
    PrismaModule,
    RedisModule,
    UploadModule,
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    StationsModule,
    BookingsModule,
    SubscriptionsModule,
    ChatModule,
    AdminModule,
  ],
})
export class AppModule {}
