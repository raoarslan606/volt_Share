import { Module } from '@nestjs/common';
import { StationsController } from './stations.controller';
import { StationsService } from './stations.service';
import { StationsScheduler } from './stations.scheduler';

@Module({
  controllers: [StationsController],
  providers: [StationsService, StationsScheduler],
  exports: [StationsService],
})
export class StationsModule {}
