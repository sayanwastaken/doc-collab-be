import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoServerError } from 'mongodb';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle MongoDB errors
    if (exception instanceof MongoServerError) {
      if (exception.code === 11000) {
        status = HttpStatus.CONFLICT;
        if (exception.keyPattern?.email) {
          message = 'User with this email already exists';
        } else {
          message = 'Duplicate key error';
        }
      }
    }
    // Handle NestJS HTTP exceptions
    else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `Exception occurred: ${message}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    response.status(status).json({
      statusCode: status,
      message,
      error:
        status === HttpStatus.CONFLICT ? 'Conflict' : 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
