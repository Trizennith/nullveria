import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService, // Inject the service
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    const payload = this.authService.verifyJwtToken(token);
    const session = await this.authService.validateSessionWithDB(payload.userID, payload.sessionID);

    if (!session) {
      throw new HttpException('Invalid session ID', HttpStatus.BAD_REQUEST, {
        cause: new Error('Invalid session ID'),
        description: 'Invalid session ID',
      });
    }
    request['user'] = payload;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
