import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
  ParseFloatPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { StationsService } from './stations.service';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST' as any)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register a new charging station (Host only)' })
  create(@CurrentUser() user: User, @Body() dto: CreateStationDto) {
    return this.stationsService.create(user.id, dto);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST' as any)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current host\'s registered stations' })
  findMine(@CurrentUser() user: User) {
    return this.stationsService.findMine(user.id);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST' as any)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload up to 5 station photos' })
  @UseInterceptors(
    FilesInterceptor('photos', 5, { storage: memoryStorage() }),
  )
  uploadPhotos(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.stationsService.uploadPhotos(user.id, id, files);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('HOST' as any)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update station info (owner only)' })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStationDto,
  ) {
    return this.stationsService.update(user.id, id, dto);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby approved stations using PostGIS' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'radiusMeters', type: Number, required: false })
  findNearby(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lng', ParseFloatPipe) lng: number,
    @Query('radiusMeters', new DefaultValuePipe(5000), ParseIntPipe) radiusMeters: number,
  ) {
    return this.stationsService.findNearby({ lat, lng, radiusMeters });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get station details' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stationsService.findById(id);
  }
}
