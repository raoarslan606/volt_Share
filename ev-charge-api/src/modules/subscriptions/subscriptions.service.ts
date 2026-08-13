import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async uploadProof(file: Express.Multer.File): Promise<{ url: string }> {
    const url = await this.uploadService.uploadFile(file, 'ev-charge/subscription-proofs');
    return { url };
  }

  async create(hostId: string, dto: CreateSubscriptionDto) {
    return this.prisma.subscription.create({
      data: {
        hostId,
        amount: dto.amount,
        transactionId: dto.transactionId,
        screenshotUrl: dto.screenshotUrl,
        status: 'PENDING',
      },
    });
  }

  async getMine(hostId: string) {
    return this.prisma.subscription.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
