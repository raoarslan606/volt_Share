import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { UploadService } from '../upload/upload.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';

interface NearbyQuery {
  lat: number;
  lng: number;
  radiusMeters?: number;
}

function getHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class StationsService {
  private readonly logger = new Logger(StationsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private uploadService: UploadService,
  ) {}

  async create(hostId: string, dto: CreateStationDto) {
    return this.prisma.station.create({
      data: {
        ...dto,
        hostId,
        verificationStatus: 'PENDING',
      },
    });
  }

  async findMine(hostId: string) {
    return this.prisma.station.findMany({
      where: { hostId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadPhotos(
    hostId: string,
    stationId: string,
    files: Express.Multer.File[],
  ) {
    const station = await this.findAndVerifyOwner(stationId, hostId);
    const urls = await this.uploadService.uploadMultiple(files, 'ev-charge/stations');
    return this.prisma.station.update({
      where: { id: stationId },
      data: { photos: { push: urls } },
    });
  }

  async update(hostId: string, stationId: string, dto: UpdateStationDto) {
    await this.findAndVerifyOwner(stationId, hostId);
    return this.prisma.station.update({
      where: { id: stationId },
      data: dto,
    });
  }

  async findNearby({ lat, lng, radiusMeters = 15000 }: NearbyQuery) {
    const roundedLat = Math.round(lat * 1000) / 1000;
    const roundedLng = Math.round(lng * 1000) / 1000;
    const cacheKey = `nearby:${roundedLat}:${roundedLng}:${radiusMeters}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore cache failure
    }

    let stations: any[] = [];

    try {
      stations = await this.prisma.$queryRaw<any[]>`
        SELECT
          s.id,
          s."stationName",
          s."stationType",
          s.latitude,
          s.longitude,
          s.address,
          s.capacity,
          s."connectorType",
          s."pricePerKwh",
          s.photos,
          s."isAvailable",
          s."verificationStatus",
          s."subscriptionExpiry",
          s."createdAt",
          s."hostId",
          u.name AS "hostName",
          u.phone AS "hostPhone",
          ST_Distance(s.geog, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) AS distance
        FROM "Station" s
        JOIN "User" u ON u.id = s."hostId"
        WHERE
          (s."verificationStatus" = 'APPROVED' OR s."verificationStatus" = 'PENDING')
          AND s."isAvailable" = true
          AND ST_DWithin(
            s.geog,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )
        ORDER BY distance ASC
        LIMIT 50
      `;
    } catch (postGisError: any) {
      this.logger.warn(
        `PostGIS spatial query bypassed or column geog missing. Falling back to standard query. ${postGisError.message}`,
      );

      const allStations = await this.prisma.station.findMany({
        where: {
          isAvailable: true,
        },
        include: {
          host: {
            select: { name: true, phone: true },
          },
        },
        take: 50,
      });

      stations = allStations
        .map((s) => {
          const distance = getHaversineDistanceMeters(
            lat,
            lng,
            s.latitude,
            s.longitude,
          );
          return {
            ...s,
            hostName: s.host?.name,
            hostPhone: s.host?.phone,
            distance,
          };
        })
        .filter((s) => s.distance <= radiusMeters)
        .sort((a, b) => a.distance - b.distance);
    }

    try {
      await this.redisService.set(cacheKey, JSON.stringify(stations), 60);
    } catch {
      // Ignore cache write error
    }

    return stations;
  }

  async findById(id: string) {
    const station = await this.prisma.station.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, phone: true, isVerified: true },
        },
      },
    });
    if (!station) throw new NotFoundException('Station not found');
    return station;
  }

  async disableExpiredSubscriptions() {
    const now = new Date();
    const result = await this.prisma.station.updateMany({
      where: {
        stationType: 'HOUSEHOLD',
        subscriptionExpiry: { lt: now },
        isAvailable: true,
      },
      data: { isAvailable: false },
    });
    return result.count;
  }

  private async findAndVerifyOwner(stationId: string, hostId: string) {
    const station = await this.prisma.station.findUnique({
      where: { id: stationId },
    });
    if (!station) throw new NotFoundException('Station not found');
    if (station.hostId !== hostId) {
      throw new ForbiddenException('You do not own this station');
    }
    return station;
  }
}
