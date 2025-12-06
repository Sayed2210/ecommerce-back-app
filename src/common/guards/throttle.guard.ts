import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
// import { RedisService } from '@common/services/redis.service';

@Injectable()
export class ThrottleGuard implements CanActivate {
  // constructor(private readonly redisService: RedisService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Temporarily disabled - RedisService not implemented
    return true;

    /* Original implementation:
    const request = context.switchToHttp().getRequest();
    const ip = this.getIP(request);
    const key = `throttle:${ip}:${request.route.path}`;

    const attempts = await this.redisService.incr(key);

    if (attempts === 1) {
      await this.redisService.expire(key, 60); // 1 minute window
    }

    // 5 attempts per minute for login
    if (request.route.path.includes('login') && attempts > 5) {
      throw new ThrottlerException('Too many login attempts. Please try again later.');
    }

    // 100 attempts per minute for general API
    if (attempts > 100) {
      throw new ThrottlerException('Rate limit exceeded');
    }

    return true;
    */
  }

  private getIP(request: any): string {
    return (
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}