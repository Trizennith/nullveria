import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class CatchEverythingFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const httpStatus =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      status: {
        statusCode: httpStatus,
        message: process.env.IS_DEV_MODE
          ? exception instanceof HttpException
            ? exception.message
            : 'Internal server error'
          : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      path: httpAdapter.getRequestUrl(ctx.getRequest()) as string,
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
