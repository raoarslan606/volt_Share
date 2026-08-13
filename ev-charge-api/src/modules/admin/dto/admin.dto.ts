import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyStationDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}

export class VerifySubscriptionDto {
  @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
  @IsEnum(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}

export class VerifyUserDto {
  @ApiProperty({ description: 'Set user CNIC verification to true' })
  isVerified: boolean;
}
