import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export const requestIdStore = new AsyncLocalStorage<string>();

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId =
      (req.headers['x-request-id'] as string) || this.generateId();
    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);
    requestIdStore.run(requestId, () => next());
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
