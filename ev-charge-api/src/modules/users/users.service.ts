import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        authProvider: true,
        cnicImageUrl: true,
        cnicNumber: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        updatedAt: true,
      },
    });
  }

  async uploadCnic(
    userId: string,
    file: Express.Multer.File,
    cnicNumber?: string,
  ) {
    const cnicImageUrl = await this.uploadService.uploadFile(file, 'ev-charge/cnic');
    return this.prisma.user.update({
      where: { id: userId },
      data: { cnicImageUrl, ...(cnicNumber ? { cnicNumber } : {}) },
      select: { id: true, cnicImageUrl: true, cnicNumber: true },
    });
  }
}
