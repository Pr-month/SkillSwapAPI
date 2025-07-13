import { UploadsService } from './uploads.service';
import * as sharp from 'sharp';
import * as fs from 'node:fs';

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(() => {
    service = new UploadsService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('сервис должен создаваться', () => {
    expect(service).toBeDefined();
  });

  it('должен возвращать корректные данные при успешном сжатии', async () => {
    const uploadedFilePath = '/tmp/test.jpg';
    const originalFileName = 'original.jpg';
    const compressedFileName = 'test_lq.jpg';

    jest.spyOn(sharp.prototype, 'jpeg').mockReturnThis();
    jest.spyOn(sharp.prototype, 'toFile').mockImplementation(async function (
      this: any,
    ) {
      // эмулируем успешное сжатие
      return Promise.resolve();
    });
    const unlinkMock = jest
      .spyOn(fs, 'unlink')
      .mockImplementation((_, cb) => cb && cb(null));

    const result = await service.prepareFile(
      uploadedFilePath,
      originalFileName,
    );
    expect(result).toEqual({
      publicUrl: '/public/uploads/' + compressedFileName,
      fileName: compressedFileName,
      originalName: originalFileName,
    });
    expect(unlinkMock).toHaveBeenCalledWith(
      uploadedFilePath,
      expect.any(Function),
    );
  });

  it('должен возвращать исходный файл при ошибке сжатия', async () => {
    const uploadedFilePath = '/tmp/test.jpg';
    const originalFileName = 'original.jpg';

    jest.spyOn(sharp.prototype, 'jpeg').mockReturnThis();
    jest.spyOn(sharp.prototype, 'toFile').mockImplementation(function () {
      throw new Error('Ошибка сжатия');
    });
    const unlinkMock = jest
      .spyOn(fs, 'unlink')
      .mockImplementation((_, cb) => cb && cb(null));

    const result = await service.prepareFile(
      uploadedFilePath,
      originalFileName,
    );
    expect(result).toEqual({
      publicUrl: '/public/uploads/test.jpg',
      fileName: 'test.jpg',
      originalName: originalFileName,
    });
    expect(unlinkMock).not.toHaveBeenCalled();
  });
});
