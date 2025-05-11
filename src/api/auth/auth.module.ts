import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtContextGuard } from './auth.guard';
import { PrismaService } from 'src/databases/prisma/prisma.service';
import { AuthConstants } from './constants';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET as string,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtContextGuard, PrismaService, JwtService, AuthConstants],
  exports: [JwtContextGuard, JwtService, AuthService],
})
export class AuthModule {}
