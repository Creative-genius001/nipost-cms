/* eslint-disable prettier/prettier */
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLogger } from '../logger/logger.service';
import { ERROR } from 'src/utils/error';

@Catch(HttpException)
export class HttpExceptionsFilter implements ExceptionFilter {

  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseObject: Record<string, any> = {
      statusCode: status,
      path: request.url,
    };
    

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorMessage = exception.getResponse() as HttpException;
      responseObject = {
        ...responseObject,
        statusCode: status,
        ...(typeof errorMessage === 'string'
          ? { message: errorMessage }
          : (errorMessage as object)),
      };
      this.logger.error(
       'Handled HttpException',{
        stack: exception.stack,
        error: responseObject,
      });

      return response.status(status).json(errorMessage);
    } 
    
      // Log the stack for non-HttpException errors
    if (exception instanceof Error) {

      responseObject = {
        ...responseObject,
        error: exception.name,
        message: exception.message,
      };

      this.logger.error(
        exception.message,{
        name: exception.name,
        stack: exception.stack,
      });

    } else {
       responseObject = {
        ...responseObject,
        error: 'InternalServerError',
        message: 'Unexpected error occurred',
      };

      this.logger.error('Unexpected error occurred', {exception});
    }

    return response.status(status).json(ERROR.INTERNAL_SERVER_ERROR);
  }
}
