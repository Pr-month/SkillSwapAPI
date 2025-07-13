import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger/mainLogger';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use = (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000;

      const httpLogData = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        statusCode: res.statusCode,
        responseDurationMs: duration.toFixed(2),
        userAgent: req.headers['user-agent'],
      };

      if (res.statusCode >= 400) {
        logger.error(
          `HTTP Request: ${req.method} ${req.originalUrl} - ${res.statusCode}`,
          httpLogData,
          'HTTP',
        );
      } else {
        logger.info(
          `HTTP Request: ${req.method} ${req.originalUrl} - ${res.statusCode}`,
          httpLogData,
          'HTTP',
        );
      }
    });

    next();
  };
}
