import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { JwtTokenRevoker } from '../services/jwt.revoker.service';

@Injectable()
export class JwtRevokeGuard implements CanActivate {
  constructor(
    private authService: AuthService, // Inject the service
    private readonly jwtRevoker: JwtTokenRevoker, // Inject the revoker service
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    return await this.jwtRevoker.isTokenRevoked(token);
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
