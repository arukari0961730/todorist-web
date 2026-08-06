import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incoming = request.header('x-request-id');
    request.requestId =
      incoming && incoming.length <= 100 ? incoming : randomUUID();
    response.setHeader('x-request-id', request.requestId);
    next();
  }
}
