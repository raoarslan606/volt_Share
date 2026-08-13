import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { VerifyStationDto, VerifySubscriptionDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN' as any)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─────────────── STATIONS ───────────────

  @Get('stations/pending')
  @ApiOperation({ summary: 'List stations awaiting verification' })
  getPendingStations() {
    return this.adminService.getPendingStations();
  }

  @Patch('stations/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a station' })
  verifyStation(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyStationDto,
  ) {
    return this.adminService.verifyStation(admin.id, id, dto.status);
  }

  // ─────────────── SUBSCRIPTIONS ───────────────

  @Get('subscriptions/pending')
  @ApiOperation({ summary: 'List pending subscription payment proofs' })
  getPendingSubscriptions() {
    return this.adminService.getPendingSubscriptions();
  }

  @Patch('subscriptions/:id/verify')
  @ApiOperation({ summary: 'Approve or reject a subscription (updates station expiry on approval)' })
  verifySubscription(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifySubscriptionDto,
  ) {
    return this.adminService.verifySubscription(admin.id, id, dto.status);
  }

  // ─────────────── USERS ───────────────

  @Get('users')
  @ApiOperation({ summary: 'List users with optional filters' })
  @ApiQuery({ name: 'role', required: false, enum: ['DRIVER', 'HOST', 'ADMIN'] })
  @ApiQuery({ name: 'isVerified', required: false, type: Boolean })
  getUsers(
    @Query('role') role?: string,
    @Query('isVerified') isVerified?: string,
  ) {
    const verified =
      isVerified === 'true' ? true : isVerified === 'false' ? false : undefined;
    return this.adminService.getUsers(role, verified);
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Verify a user\'s CNIC' })
  verifyUser(
    @CurrentUser() admin: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.verifyUser(admin.id, id);
  }
}
