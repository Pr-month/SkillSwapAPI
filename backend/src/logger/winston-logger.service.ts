import {
  Injectable,
  LoggerService as NestJsLoggerService,
} from '@nestjs/common';
import { logger } from './mainLogger';
import { colors } from './codeColor';

@Injectable()
export class WinstonLoggerService implements NestJsLoggerService {
  private formatLogMessage(message: any, optionalParams: any[] = []): string {
    const stringMessage = String(message);
    let fullLogMessage = stringMessage;

    let context: string | undefined;
    const paramsToProcess: any[] = [...(optionalParams as Array<unknown>)];

    if (
      paramsToProcess.length > 0 &&
      typeof paramsToProcess[paramsToProcess.length - 1] === 'string'
    ) {
      context = paramsToProcess.pop() as string;
    }

    if (context) {
      fullLogMessage = `${colors.fgCyan}[${context}]${colors.reset} ${fullLogMessage}`;
    }

    if (paramsToProcess.length > 0) {
      const additionalInfo = paramsToProcess
        .map((param) => {
          if (typeof param === 'object' && param !== null) {
            try {
              return JSON.stringify(param, null, 2);
            } catch {
              return String(param);
            }
          }
          return String(param);
        })
        .join('\n    ');
      fullLogMessage += `\nAdditional Data:\n    ${additionalInfo}`;
    }

    return fullLogMessage;
  }

  private write(
    level: 'info' | 'error' | 'warn' | 'debug' | 'verbose',
    message: any,
    optionalParams: any[],
  ) {
    const formattedMessage = this.formatLogMessage(message, optionalParams);
    logger[level](formattedMessage);
  }

  log(message: any, ...optionalParams: any[]) {
    this.write('info', message, optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.write('error', message, optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.write('warn', message, optionalParams);
  }

  debug?(message: any, ...optionalParams: any[]) {
    this.write('debug', message, optionalParams);
  }

  verbose?(message: any, ...optionalParams: any[]) {
    this.write('verbose', message, optionalParams);
  }

  fatal?(message: any, ...optionalParams: any[]) {
    this.write('error', message, optionalParams);
  }
}
