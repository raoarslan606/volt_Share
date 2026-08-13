import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class SignupDto {
  @ApiProperty({ example: 'Ali Raza' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '03001234567' })
  @IsString()
  @Matches(/^03\d{9}$/, {
    message: 'Phone must be a valid Pakistani mobile number (03XXXXXXXXX)',
  })
  phone: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  password: string;

  @ApiProperty({ enum: ['DRIVER', 'HOST'], example: 'DRIVER' })
  @IsEnum(['DRIVER', 'HOST'], { message: 'Role must be DRIVER or HOST' })
  role: 'DRIVER' | 'HOST';
}
