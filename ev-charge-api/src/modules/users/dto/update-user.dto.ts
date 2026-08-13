import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ali Raza' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: '03001234567' })
  @IsOptional()
  @IsString()
  @Matches(/^03\d{9}$/, {
    message: 'Phone must be a valid Pakistani mobile number (03XXXXXXXXX)',
  })
  phone?: string;
}

export class UploadCnicDto {
  @ApiPropertyOptional({ example: '35202-1234567-8' })
  @IsOptional()
  @IsString()
  cnicNumber?: string;
}
