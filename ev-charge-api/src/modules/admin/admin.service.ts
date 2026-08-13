import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─────────────── STATIONS ───────────────

  async getPendingStations() {
    return this.prisma.station.findMany({
      where: { verificationStatus: 'PENDING' },
      include: { host: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifyStation(
    adminId: string,
    stationId: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    const station = await this.prisma.station.update({
      where: { id: stationId },
      data: {
        verificationStatus: status,
        isAvailable: status === 'APPROVED',
      },
    });

    await this.logAction(adminId, 'VERIFY_STATION', 'Station', stationId, {
      status,
    });
    return station;
  }

  // ─────────────── SUBSCRIPTIONS ───────────────

  async getPendingSubscriptions() {
    return this.prisma.subscription.findMany({
      where: { status: 'PENDING' },
      include: {
        host: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async verifySubscription(
    adminId: string,
    subscriptionId: string,
    status: 'APPROVED' | 'REJECTED',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.findUniqueOrThrow({
        where: { id: subscriptionId },
        include: { host: { include: { stations: true } } },
      });

      const validTill =
        status === 'APPROVED'
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : undefined;

      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status,
          approvedBy: adminId,
          ...(validTill ? { validTill } : {}),
        },
      });

      // If approved, update all HOUSEHOLD stations for this host
      if (status === 'APPROVED') {
        await tx.station.updateMany({
          where: { hostId: subscription.hostId, stationType: 'HOUSEHOLD' },
          data: { subscriptionExpiry: validTill, isAvailable: true },
        });
      }

      await this.logAction(
        adminId,
        'VERIFY_SUBSCRIPTION',
        'Subscription',
        subscriptionId,
        { status, validTill },
        tx,
      );

      return updated;
    });
  }

  // ─────────────── USERS ───────────────

  async getUsers(role?: string, isVerified?: boolean) {
    return this.prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(isVerified !== undefined ? { isVerified } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        cnicImageUrl: true,
        cnicNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyUser(adminId: string, userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: { id: true, name: true, isVerified: true },
    });

    await this.logAction(adminId, 'VERIFY_USER', 'User', userId, {});
    return user;
  }

  // ─────────────── AUDIT LOG ───────────────

  private async logAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    metadata: Record<string, unknown>,
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    return client.auditLog.create({
      data: { adminId, action, targetType, targetId, metadata },
    });
  }
}
