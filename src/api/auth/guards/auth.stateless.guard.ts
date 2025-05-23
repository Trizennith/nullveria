import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import * as crypto from 'crypto';
import { COOKIE_ATTR_JWT_FINGERPRINT } from '../constants/constant';

@Injectable()
export class JwtStatelessGuard implements CanActivate {
  constructor(
    private authService: AuthService, // Inject the service
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    const payload = this.authService.verifyJwtToken(token);
    const cookies = request.cookies as Record<string, string> | undefined;
    const ctxCookie = cookies![COOKIE_ATTR_JWT_FINGERPRINT.JWT];

    if (!ctxCookie || !payload.ctxHash) return false;

    const expectedHash = crypto.createHash('sha256').update(ctxCookie).digest('hex');
    request['user'] = payload;
    return expectedHash === payload.ctxHash;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
