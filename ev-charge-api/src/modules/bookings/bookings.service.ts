import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './dto/booking.dto';

// Valid status state machine transitions
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
};

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(driverId: string, dto: CreateBookingDto) {
    const bookingDate = new Date(dto.date);
    if (bookingDate < new Date()) {
      throw new BadRequestException('Booking date cannot be in the past');
    }

    // Use transaction to prevent double-booking race condition
    return this.prisma.$transaction(async (tx) => {
      // Lock-check: is this time slot already CONFIRMED?
      const existing = await tx.booking.findFirst({
        where: {
          stationId: dto.stationId,
          timeSlot: dto.timeSlot,
          date: bookingDate,
          status: 'CONFIRMED',
        },
      });

      if (existing) {
        throw new ConflictException('This time slot is already booked');
      }

      return tx.booking.create({
        data: {
          driverId,
          stationId: dto.stationId,
          date: bookingDate,
          timeSlot: dto.timeSlot,
          status: 'PENDING',
        },
        include: {
          station: { select: { stationName: true, address: true } },
        },
      });
    });
  }

  async getDriverBookings(driverId: string) {
    return this.prisma.booking.findMany({
      where: { driverId },
      include: {
        station: { select: { stationName: true, address: true, photos: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getHostBookings(hostId: string) {
    return this.prisma.booking.findMany({
      where: { station: { hostId } },
      include: {
        driver: { select: { name: true, phone: true } },
        station: { select: { stationName: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async updateStatus(
    userId: string,
    bookingId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { station: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    // Validate transition
    const allowed = ALLOWED_TRANSITIONS[booking.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${dto.status}`,
      );
    }

    // Permission check
    const isHost = booking.station.hostId === userId;
    const isDriver = booking.driverId === userId;

    if (dto.status === 'CANCELLED' && !isDriver && !isHost) {
      throw new ForbiddenException('Only the driver or host can cancel');
    }

    if (['CONFIRMED', 'REJECTED', 'COMPLETED'].includes(dto.status) && !isHost) {
      throw new ForbiddenException('Only the host can confirm, reject, or complete');
    }

    const updateData: any = { status: dto.status };
    if (dto.status === 'COMPLETED' && dto.unitsCharged) {
      updateData.unitsCharged = dto.unitsCharged;
      updateData.totalAmount = dto.unitsCharged * booking.station.pricePerKwh;
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });
  }
}
