/* eslint-disable prettier/prettier */
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AppLogger } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

    constructor(private readonly logger: AppLogger){}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, originalUrl, ip } = request;
    const now = Date.now()

    // this.logger.log({
    //   message: 'Incoming request',
    //   method,
    //   path: originalUrl,  
    //   ip: ip || 'unknown',  
    //   userAgent: request.headers['user-agent'] || 'not-provided',
    // });

    return next.handle()
    .pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log({
          message: 'Request completed',
          status: response.status,
          method,
          path: originalUrl,
          ip: ip || 'unknown', 
          userAgent: request.headers['user-agent'] || 'not-provided',
          duration: `${responseTime}ms`,
        });
      })
    );
  }
}