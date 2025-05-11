import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ZodError } from 'zod';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody;

    if (exception instanceof ZodError) {
      responseBody = {
        status: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation error',
          errors: exception.issues,
          timestamp: new Date().toISOString(),
        },
        path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
      };
    } else if (exception instanceof HttpException) {
      responseBody = {
        status: {
          statusCode: httpStatus,
          message: exception.message,
          timestamp: new Date().toISOString(),
        },
        path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
      };
    } else {
      responseBody = {
        status: {
          statusCode: httpStatus,
          message:
            process.env.IS_DEV_MODE === 'true'
              ? (exception as Error).stack
              : 'Internal server error',
          timestamp: new Date().toISOString(),
        },
        path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
      };
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
