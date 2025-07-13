import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  PayloadTooLargeException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { EntityNotFoundError } from 'typeorm/error/EntityNotFoundError';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    console.log(exception);
    console.log(typeof exception);
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
      console.log(detail);
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
        message: `Вес файла не должен превышать ${this.configService.get<string>('upload.fileSizeMax')} МБ`,
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
