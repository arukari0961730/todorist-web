import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

interface ErrorPayload {
  code?: string;
  message?: string | string[];
  errors?: unknown;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const requestId = request.requestId;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'サーバー内部でエラーが発生しました';
    let errors: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        message = payload;
      } else {
        const body = payload as ErrorPayload;
        code = body.code ?? this.defaultCode(status);
        message = Array.isArray(body.message)
          ? '入力内容に問題があります'
          : (body.message ?? exception.message);
        errors =
          body.errors ??
          (Array.isArray(body.message)
            ? body.message.map((item) => ({
                code: 'INVALID_VALUE',
                message: item,
              }))
            : undefined);
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (String(exception.code) === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'DUPLICATE_RESOURCE';
        message = '同じ値のデータがすでに存在します';
      } else if (String(exception.code) === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'データが見つかりません';
      }
    }

    if (status >= 500) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.originalUrl}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      ...(errors ? { errors } : {}),
      requestId,
    });
  }

  private defaultCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
    };
    return codes[status] ?? 'HTTP_ERROR';
  }
}
