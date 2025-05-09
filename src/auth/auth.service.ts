import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../databases/prisma/prisma.service';
import type { User, UserSession } from '@prisma/client';
import { JwtPayload } from './interfaces/auth-request.type'; // Import the JwtPayload type
import { authPasswordHasher } from 'src/common/libs/hasher';
import { AuthConstants } from './constants';
import { LoginResult, SessionsResult } from './dto/services.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // Use PrismaService
    private readonly jwtService: JwtService,
  ) {}

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<User> {
    const hashedPassword = await authPasswordHasher(password);
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
      },
    });
  }

  async login(
    email: string,
    password: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
  ): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userSession = await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenExpiry: new Date(
          Date.now() + AuthConstants.REFRESH_TOKEN_DAYS_EXPIRY * 24 * 60 * 60 * 1000,
        ),
        ipAddress,
        userAgent,
      },
    });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { totalLogins: { increment: 1 } },
    });

    const payload: JwtPayload = {
      sessionID: userSession.id.toString(),
      email: user.email,
      userID: user.id.toString(),
      role: user.role,
    };
    const accessToken = this.signJwtToken(payload);
    const refreshToken = this.signJwtRefreshToken(payload);

    await this.prisma.userSession.update({
      where: { id: userSession.id },
      data: { refreshToken },
    });

    return {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role as 'user' | 'admin' | 'super_admin',
      isActive: user.isActive,
      isVerified: user.isVerified,
      sessionData: {
        accessToken,
        refreshToken,
      },
    };
  }

  private signJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, { secret: AuthConstants.JWT_SECRET });
  }

  private signJwtRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: AuthConstants.JWT_REFRESH_SECRET,
      expiresIn: `${AuthConstants.REFRESH_TOKEN_DAYS_EXPIRY}d`,
    });
  }

  verifyJwtRefreshToken(refreshToken: string) {
    return this.jwtService.verify<JwtPayload>(refreshToken, {
      secret: AuthConstants.JWT_REFRESH_SECRET,
    });
  }

  verifyJwtToken(token: string) {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: AuthConstants.JWT_SECRET,
    });
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.verifyJwtRefreshToken(refreshToken);
      const userSession = await this.prisma.userSession.findUnique({
        where: { id: parseInt(payload.sessionID, 10) },
      });

      if (!userSession || userSession.userId !== parseInt(payload.userID, 10)) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      if (!userSession || userSession.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      /**
       * we can't pass the var "payload" directly,
       * because it contains "expiresIn" property that has a value.
       * By doing so it will cause an error.
       */
      const newAccessToken = this.signJwtToken({
        email: payload.email,
        userID: payload.userID,
        sessionID: payload.sessionID,
        role: payload.role,
      } as JwtPayload);

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getSessions(userId_: string): Promise<SessionsResult> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId: parseInt(userId_, 10) },
      select: {
        loginTime: true,
        refreshTokenExpiry: true,
        logoutTime: true,
        ipAddress: true,
        userAgent: true,
        location: true,
        additionalInfo: true,
      },
    });

    if (!sessions) {
      throw new UnauthorizedException('User not found');
    }

    return {
      lastLoginAt: sessions[0].loginTime,
      loginCount: sessions.length,
      userAgent: sessions[0].userAgent || undefined,
      totalActiveLogin: sessions.filter((session) => !session.logoutTime).length,
      loginData: sessions.map((session) => ({
        loginAt: session.loginTime,
        refreshTokenExpiry: session.refreshTokenExpiry,
        logoutTime: session.logoutTime || undefined,
        metadata: {
          ipAddress: session.ipAddress || undefined,
          userAgent: session.userAgent || undefined,
          location: session.location || undefined,
          additionalInfo:
            typeof session.additionalInfo === 'object' && session.additionalInfo !== null
              ? session.additionalInfo
              : {},
        },
      })),
    };
  }

  async logout(userId: string, sessionId: string): Promise<boolean> {
    const userSession = await this.prisma.userSession.findUnique({
      where: { id: parseInt(sessionId, 10) },
    });

    if (!userSession || userSession.userId !== parseInt(userId, 10)) {
      throw new UnauthorizedException('Session not found or does not belong to the user');
    }

    await this.prisma.userSession.delete({
      where: { id: parseInt(sessionId, 10) },
    });

    return true;
  }

  async removeAllUserSessions(userId: string): Promise<boolean> {
    await this.prisma.userSession.deleteMany({
      where: {
        userId: parseInt(userId, 10),
      },
    });
    return true;
  }

  async validateSessionWithDB(userId: string, sessionId: string): Promise<UserSession | null> {
    const userSession = await this.prisma.userSession.findFirst({
      where: { AND: { id: parseInt(sessionId, 10), userId: parseInt(userId, 10) } },
    });

    if (!userSession || userSession.logoutTime) {
      return null;
    }

    if (new Date() > userSession.refreshTokenExpiry) {
      await this.prisma.userSession.delete({ where: { id: userSession.id } });
      return null;
    }

    return userSession;
  }

  private async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
}
