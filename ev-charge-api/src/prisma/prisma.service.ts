import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully via Prisma');
    } catch (error: any) {
      this.logger.warn(
        `Database connection warning: Please verify your Supabase DB password in ev-charge-api/.env file. Error: ${error.message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
