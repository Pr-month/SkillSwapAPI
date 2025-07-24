import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  PayloadTooLargeException,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';
import { IConfig } from '../config/configuration';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly config: Pick<IConfig, 'upload'>) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      exception.code === '23505'
    ) {
      const driverError = (exception as unknown as QueryFailedError)
        .driverError as {
        detail?: string;
        table?: string;
      };

      const detail = driverError?.detail ?? '';
      const table = driverError?.table ?? 'Entity';
      const match = detail.match(/\((.+?)\)=\((.+?)\)/);
      const field = match?.[1];
      const value = match?.[2];

      const message =
        field && value
          ? `${table} с таким ${field} ${value} уже существует`
          : `${table} с таким уникальным значением уже существует`;

      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message,
      });
    }

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      exception.code === '23502'
    ) {
      const driverError = (exception as unknown as QueryFailedError)
        .driverError as {
        detail?: string;
        table?: string;
        column?: string;
      };

      const table = driverError?.table ?? 'Entity';
      const column = driverError?.column ?? 'field';

      const message = `Поле ${column} в таблице ${table} является обязательным`;

      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
      });
    }

    if (exception instanceof EntityNotFoundError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
      });
    }
    if (exception instanceof QueryFailedError) {
      return response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
      });
    }

    if (
      exception instanceof PayloadTooLargeException ||
      (typeof exception === 'object' &&
        exception !== null &&
        'name' in exception &&
        exception.name === 'PayloadTooLargeException')
    ) {
      return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: `Вес файла не должен превышать ${this.config.upload.fileSizeMax} МБ`,
      });
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    return response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
