import { ConfigService } from '@nestjs/config';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';

export const acceptedImageTypes = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
];

export function createMulterConfig(config: ConfigService): MulterOptions {
  return {
    storage: diskStorage({
      destination: config.get<string>('upload.dir', './public/uploads'),
      filename: (_req, file, cb) => {
        const uniqueName = uuidv4() + extname(file.originalname);
        cb(null, uniqueName);
      },
    }),
    limits: {
      fileSize: config.get<number>('upload.fileSizeMax', 2 * 1024 * 1024),
    },
    fileFilter: (_req, file, cb) => {
      if (!acceptedImageTypes.includes(file.mimetype)) {
        return cb(
          new HttpException('Ожидается изображение', HttpStatus.BAD_REQUEST),
          false,
        );
      }
      cb(null, true);
    },
  };
}
