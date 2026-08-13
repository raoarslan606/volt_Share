import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('DRIVER' as any)
  @ApiOperation({ summary: 'Create a booking (Driver only)' })
  create(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get current driver\'s bookings' })
  getMyBookings(@CurrentUser() user: User) {
    return this.bookingsService.getDriverBookings(user.id);
  }

  @Get('host')
  @UseGuards(RolesGuard)
  @Roles('HOST' as any)
  @ApiOperation({ summary: 'Get bookings for all stations owned by this host' })
  getHostBookings(@CurrentUser() user: User) {
    return this.bookingsService.getHostBookings(user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status (host confirms/rejects, driver cancels)' })
  updateStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(user.id, id, dto);
  }
}
