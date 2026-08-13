import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleAuthDto, CompleteProfileDto } from './dto/google-auth.dto';
import { Role } from '@prisma/client';

const BCRYPT_ROUNDS = 12;
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  // ──────────────────────────── SIGNUP ────────────────────────────────

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });

    if (exists) {
      throw new ConflictException(
        exists.email === dto.email
          ? 'Email already registered'
          : 'Phone number already registered',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        passwordHash,
        role: dto.role as Role,
        authProvider: 'LOCAL',
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ──────────────────────────── LOGIN ─────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ──────────────────────────── GOOGLE ────────────────────────────────

  async googleAuth(dto: GoogleAuthDto) {
    let payload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    const { sub: googleId, email, name } = payload;

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: name ?? 'Google User',
          email,
          googleId,
          authProvider: 'GOOGLE',
          role: 'DRIVER',
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
    }

    const tokens = await this.issueTokens(user.id, user.email, user.role);

    if (!user.phone) {
      return { ...tokens, needsPhoneNumber: true };
    }

    return tokens;
  }

  // ──────────────────────────── COMPLETE PROFILE ──────────────────────

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    const phoneExists = await this.prisma.user.findFirst({
      where: { phone: dto.phone, id: { not: userId } },
    });

    if (phoneExists) {
      throw new ConflictException('Phone number already in use');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { phone: dto.phone },
    });

    return { message: 'Profile updated successfully' };
  }

  // ──────────────────────────── REFRESH ───────────────────────────────

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedHash = await this.redisService.get(`refresh:${payload.sub}`);
    if (!storedHash) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const valid = await bcrypt.compare(refreshToken, storedHash);
    if (!valid) {
      throw new UnauthorizedException('Refresh token mismatch');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return this.issueTokens(user.id, user.email, user.role);
  }

  // ──────────────────────────── LOGOUT ────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.redisService.del(`refresh:${userId}`);
  }

  // ──────────────────────────── HELPERS ───────────────────────────────

  private async issueTokens(userId: string, email: string, role: Role) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Store hashed refresh token in Redis
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.redisService.set(`refresh:${userId}`, hash, REFRESH_TTL_SECONDS);

    return { accessToken, refreshToken, userId, role };
  }
}
