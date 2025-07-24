import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { HttpException, HttpStatus } from '@nestjs/common';
import { IConfig } from '../config/configuration';

export const acceptedImageTypes = [
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/gif',
];

export function createMulterConfig(config: IConfig): MulterOptions {
  return {
    storage: diskStorage({
      destination: config.upload.dir,
      filename: (_req, file, cb) => {
        const uniqueName = uuidv4() + extname(file.originalname);
        cb(null, uniqueName);
      },
    }),
    limits: {
      fileSize: config.upload.fileSizeMax,
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
