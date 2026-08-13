import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  stationId: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '10:00-11:00' })
  @IsString()
  @IsNotEmpty()
  timeSlot: string;
}

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'] })
  @IsEnum(['CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED'])
  status: string;

  @ApiPropertyOptional({ example: 5.2 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  unitsCharged?: number;
}
