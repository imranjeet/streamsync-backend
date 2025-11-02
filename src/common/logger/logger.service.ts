import { Injectable, Logger } from '@nestjs/common';

/**
 * Structured logging service using NestJS Logger (can be replaced with pino/winston)
 * Includes requestId and user context for better traceability
 */
@Injectable()
export class AppLogger extends Logger {
  logWithContext(message: string, context?: string, requestId?: string, userId?: string) {
    const logMessage = {
      message,
      context: context || 'App',
      ...(requestId && { requestId }),
      ...(userId && { userId }),
      timestamp: new Date().toISOString(),
    };
    super.log(JSON.stringify(logMessage), context);
  }

  errorWithContext(
    message: string,
    trace?: string,
    context?: string,
    requestId?: string,
    userId?: string,
  ) {
    const logMessage = {
      message,
      context: context || 'App',
      ...(requestId && { requestId }),
      ...(userId && { userId }),
      timestamp: new Date().toISOString(),
      ...(trace && { trace }),
    };
    super.error(JSON.stringify(logMessage), trace, context);
  }
}

