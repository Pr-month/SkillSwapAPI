import { describe, it, beforeEach, jest } from '@jest/globals';
import { AllExceptionFilter } from './all-exception.filter';
import {
  ArgumentsHost,
  HttpStatus,
  PayloadTooLargeException,
  HttpException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';

describe('AllExceptionFilter', () => {
  let filter: AllExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockHost: ArgumentsHost;
  let configService: { upload: { fileSizeMax: number; dir: string } };

  beforeEach(() => {
    configService = {
      upload: { fileSizeMax: 2, dir: '' },
    };
    filter = new AllExceptionFilter(configService);
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: () => ({ getResponse: () => mockResponse }),
    } as unknown as ArgumentsHost;
  });

  it('должен возвращать 409 при ошибке уникальности (23505)', () => {
    const exception = {
      code: '23505',
      driverError: {
        detail: '(email)=(test@email.com) already exists',
        table: 'User',
      },
    };
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'User с таким email test@email.com уже существует',
    });
  });

  it('должен возвращать 409 при ошибке уникальности без таблицы (23505)', () => {
    const exception = {
      code: '23505',
      driverError: {
        // detail: 'already exists',
        // table: 'User',
      },
    };
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      message: 'Entity с таким уникальным значением уже существует',
    });
  });

  it('должен возвращать 404 при EntityNotFoundError', () => {
    const exception = new EntityNotFoundError('User', {});
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
    });
  });

  it('должен возвращать 404 при QueryFailedError', () => {
    const exception = new QueryFailedError('SELECT', [], new Error('error'));
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
    });
  });

  it('должен возвращать 413 при PayloadTooLargeException', () => {
    const exception = new PayloadTooLargeException();
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.PAYLOAD_TOO_LARGE,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
      message: 'Вес файла не должен превышать 2 МБ',
    });
  });

  it('должен возвращать статус и message из HttpException', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      message: exception.getResponse(),
    });
  });

  it('должен возвращать 500 для неизвестной ошибки', () => {
    const exception = 'some error';
    filter.catch(exception, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
