import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsPositive,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ConnectorType {
  TYPE2 = 'Type2',
  CCS2 = 'CCS2',
  CHADEMO = 'CHAdeMO',
  GBT = 'GB-T',
}

export enum CapacityType {
  KW7 = '7kW',
  KW11 = '11kW',
  KW22 = '22kW',
  DC_FAST = 'DC Fast',
}

export class CreateStationDto {
  @ApiProperty({ enum: ['HOUSEHOLD', 'PUBLIC'] })
  @IsEnum(['HOUSEHOLD', 'PUBLIC'])
  stationType: 'HOUSEHOLD' | 'PUBLIC';

  @ApiProperty({ example: 'Ali\'s Home Charger' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  stationName: string;

  @ApiProperty({ example: 31.5497 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude: number;

  @ApiProperty({ example: 74.3436 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude: number;

  @ApiProperty({ example: 'DHA Phase 5, Lahore' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ enum: CapacityType })
  @IsEnum(CapacityType)
  capacity: string;

  @ApiProperty({ enum: ConnectorType })
  @IsEnum(ConnectorType)
  connectorType: string;

  @ApiProperty({ example: 25.5 })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  pricePerKwh: number;
}

export class UpdateStationDto {
  @ApiPropertyOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  stationName?: string;

  @ApiPropertyOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  pricePerKwh?: number;
}
