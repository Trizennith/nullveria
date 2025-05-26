import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './services/auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './services/jwt.service';
import { JwtStatelessGuard } from './guards/jwt.stateless.guard';
import { PrismaService } from 'src/databases/prisma/prisma.service';
import { AuthConstants } from './constants';
import { JwtTokenRevoker } from './services/jwt.revoker.service';
import { JwtRevokeGuard } from './guards/jwt.revoked.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtRevokeGuard,
    JwtTokenRevoker,
    AuthService,
    JwtStrategy,
    JwtStatelessGuard,
    PrismaService,
    JwtService,
    AuthConstants,
  ],
  exports: [JwtStatelessGuard, JwtService, AuthService],
})
export class AuthModule {}
