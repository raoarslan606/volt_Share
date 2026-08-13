import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StationsService } from './stations.service';

@Injectable()
export class StationsScheduler {
  private readonly logger = new Logger(StationsScheduler.name);

  constructor(private stationsService: StationsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredSubscriptions() {
    this.logger.log('Running expired subscription cleanup...');
    const count = await this.stationsService.disableExpiredSubscriptions();
    this.logger.log(`Disabled ${count} stations with expired subscriptions`);
  }
}
