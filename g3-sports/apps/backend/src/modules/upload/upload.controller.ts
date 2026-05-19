import {
  Controller, Post, UploadedFile, UseInterceptors,
  UseGuards, Query, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService, UploadFolder } from './upload.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

const ALLOWED_FOLDERS: UploadFolder[] = ['avatars', 'team-logos', 'team-banners', 'tournament-banners'];

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private upload: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: UploadFolder,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new BadRequestException(`folder must be one of: ${ALLOWED_FOLDERS.join(', ')}`);
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WEBP allowed');
    }
    const result = await this.upload.uploadBuffer(file.buffer, folder);
    return { url: result.secure_url, publicId: result.public_id };
  }
}
