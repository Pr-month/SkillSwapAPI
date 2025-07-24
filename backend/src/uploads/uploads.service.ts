import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { parse, join } from 'path';
import * as fs from 'node:fs';

@Injectable()
export class UploadsService {
  async prepareFile(uploadedFilePath: string, originalFileName: string) {
    const uploadedFile = parse(uploadedFilePath);
    // Сжимаем изображение
    let resultFilePath =
      join(uploadedFile.dir, uploadedFile.name) + '_lq' + uploadedFile.ext;
    try {
      await sharp(uploadedFilePath)
        .jpeg({ quality: 100 })
        .toFile(resultFilePath);
    } catch {
      // при любых ошибках сжатия - просто используем исходный файл
      resultFilePath = uploadedFilePath;
    }
    // исходный (до сжатия) файл удалить, если успешно сжали
    if (resultFilePath !== uploadedFilePath) {
      fs.unlink(uploadedFilePath, () => {});
    }
    const resultFile = parse(resultFilePath);
    const publicUrl = `/public/uploads/${resultFile.base}`;
    return {
      publicUrl,
      fileName: resultFile.base,
      originalName: originalFileName,
    };
  }
}
