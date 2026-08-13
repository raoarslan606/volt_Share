import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ description: 'Google ID token from @react-oauth/google' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class CompleteProfileDto {
  @ApiProperty({ example: '03001234567' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}
