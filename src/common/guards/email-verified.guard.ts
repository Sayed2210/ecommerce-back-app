import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const { user } = context.switchToHttp().getRequest();
        if (!user?.isEmailVerified) {
            throw new ForbiddenException('Please verify your email address before continuing');
        }
        return true;
    }
}
