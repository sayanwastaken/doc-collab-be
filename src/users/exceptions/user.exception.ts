import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { MongoServerError } from 'mongodb';

@Catch(MongoServerError)
export class UserExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle duplicate key error (E11000)
    if (exception.code === 11000) {
      status = HttpStatus.CONFLICT;

      // Check if it's an email duplicate
      if (exception.keyPattern?.email) {
        message = 'User with this email already exists';
      } else {
        message = 'Duplicate key error';
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: 'Conflict',
      timestamp: new Date().toISOString(),
    });
  }
}
