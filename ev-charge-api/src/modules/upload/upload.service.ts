import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  validateFile(file: Express.Multer.File): void {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('File too large. Max size is 5MB.');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    mimeType: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          // Never use original filename to prevent path traversal
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error) {
            this.logger.error('Cloudinary upload error', error);
            reject(new BadRequestException('Failed to upload file'));
          } else {
            resolve(result!.secure_url);
          }
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    this.validateFile(file);
    return this.uploadBuffer(file.buffer, folder, file.mimetype);
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string): Promise<string[]> {
    return Promise.all(files.map((f) => this.uploadFile(f, folder)));
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const publicId = this.extractPublicId(url);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      this.logger.warn(`Could not delete Cloudinary asset: ${url}`);
    }
  }

  private extractPublicId(url: string): string | null {
    const match = url.match(/\/([^/]+)\.[a-z]+$/);
    return match ? match[1] : null;
  }
}
