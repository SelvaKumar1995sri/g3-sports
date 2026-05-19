import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export type UploadFolder = 'avatars' | 'team-logos' | 'team-banners' | 'tournament-banners';

@Injectable()
export class UploadService {
  constructor(private cfg: ConfigService) {
    cloudinary.config({
      cloud_name: cfg.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: cfg.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: cfg.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: UploadFolder,
    publicId?: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `g3sports/${folder}`, public_id: publicId, overwrite: true },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Cloudinary returned no result'));
          resolve(result);
        },
      );
      stream.end(buffer);
    });
  }

  async deleteAsset(publicId: string): Promise<{ result: string }> {
    const res = await cloudinary.uploader.destroy(publicId);
    if (res.result !== 'ok') {
      throw new Error(`Cloudinary delete failed: ${res.result}`);
    }
    return res as { result: string };
  }
}
