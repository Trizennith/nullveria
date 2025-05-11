import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../databases/prisma/prisma.service';
import type { User } from '@prisma/client';
import { JwtPayload, LoginDataDto } from './interfaces/auth-request.type'; // Import the JwtPayload type
import { authPasswordHasher } from 'src/common/libs/hasher';
import { AuthConstants } from './constants';
import { LoginResultDto, UserSessionsResultDto, UserRoleTypes } from './dto/services.dto';
import { ROLE } from './constants/role';
import Generator from 'src/common/utils/generator';

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
    userName: string,
    phoneNumber?: string,
  ): Promise<User> {
    const hashedPassword = await authPasswordHasher(password);
    return this.prisma.user.create({
      data: {
        phoneNumber,
        role: ROLE.USER,
        userName: userName,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
      },
    });
  }

  private generateAccessToken(userID: string, userRole: UserRoleTypes): [string, string] {
    const rawUserContextFingerPrint = Generator.generateUserContext();
    const payload: JwtPayload = {
      userID,
      role: userRole,
      expInSeconds: Math.floor(Date.now() / 1000) + 60 * AuthConstants.ACCESS_TOKEN_EXPIRY_MINS,
      ctxHash: Generator.hash(rawUserContextFingerPrint),
    };
    const jwtAccessToken = this.jwtService.sign(payload, {
      secret: AuthConstants.JWT_SECRET,
      expiresIn: `${AuthConstants.ACCESS_TOKEN_EXPIRY_MINS}m`,
    });

    return [jwtAccessToken, rawUserContextFingerPrint];
  }

  async login(loginData: LoginDataDto, fingerPrint: string): Promise<LoginResultDto> {
    const user = await this.validateUser(loginData.email, loginData.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const [accessToken, jwtRawContext] = this.generateAccessToken(
      user.id.toString(),
      user.role as UserRoleTypes,
    );
    const refreshToken = Generator.generateUniqueID();
    const uniqueSessionID = Generator.generateUniqueID();

    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        ipAddress: loginData.ipAddress,
        userAgent: loginData.userAgent,
        sessionId: uniqueSessionID,
        refreshToken: {
          create: {
            fingerprint: fingerPrint,
            hashedToken: Generator.hash(refreshToken),
            expiresAt: new Date(
              Date.now() + AuthConstants.REFRESH_TOKEN_DAYS_EXPIRY * 24 * 60 * 60 * 1000,
            ),
            revoked: false,
          },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { totalLogins: { increment: 1 } },
    });

    return {
      jwtRefreshTokenFingerPrint: fingerPrint,
      jwtRawContext,
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

  async refreshTokens(
    payload: JwtPayload,
    refreshToken: string,
    fingerprint: string,
    newFingerprint: string,
  ) {
    const hashedToken = Generator.hash(refreshToken);
    const storedRefreshToken = await this.prisma.refreshToken.findUnique({
      where: { hashedToken: hashedToken },
      select: {
        id: true,
        hashedToken: true,
        fingerprint: true,
        expiresAt: true,
        userSessionID: true,
      },
    });

    if (!storedRefreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    if (!storedRefreshToken || storedRefreshToken.fingerprint !== fingerprint) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const newRefreshToken = Generator.generateUniqueID();
    const [jwtAccessToken, rawUserContextFingerPrint] = this.generateAccessToken(
      payload.userID,
      payload.role,
    );

    // Optional: rotate refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedRefreshToken.id },
    });

    await this.prisma.refreshToken.create({
      data: {
        fingerprint: newFingerprint,
        hashedToken: Generator.hash(newRefreshToken),
        expiresAt: new Date(
          Date.now() + AuthConstants.REFRESH_TOKEN_DAYS_EXPIRY * 24 * 60 * 60 * 1000,
        ),
        userSessionID: storedRefreshToken.userSessionID,
      },
    });
    return {
      newJwtAccessToken: jwtAccessToken,
      refreshToken: newRefreshToken,
      rawUserContextFingerPrint,
      newFingerprint,
    };
  }

  async getSessions(userId_: string): Promise<UserSessionsResultDto> {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId: parseInt(userId_, 10) },
      select: {
        id: true,
        loginTime: true,
        logoutTime: true,
        ipAddress: true,
        userAgent: true,
        location: true,
        additionalInfo: true,
        refreshToken: {
          select: {
            hashedToken: true,
            expiresAt: true,
            fingerprint: true,
            revoked: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!sessions) {
      throw new UnauthorizedException('User not found');
    }

    return {
      lastLoginAt: sessions[0]?.loginTime ?? null,
      loginCount: sessions.length,
      totalActiveLogin: sessions.filter((session) => !session.logoutTime).length,
      loginData: sessions.map((session) => ({
        id: session.id.toString(),
        sessionId: session.id.toString(),
        fingerprint: session.refreshToken!.fingerprint,
        hashedToken: session.refreshToken!.hashedToken,
        revoked: session.refreshToken!.revoked,
        loginTime: session.loginTime,
        logoutTime: session.logoutTime,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        location: session.location,
        metadata: session.additionalInfo,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        expiresAt: session.refreshToken!.expiresAt,
      })),
    };
  }

  async logout(username: string, sessionId: string): Promise<boolean> {
    const userSession = await this.prisma.userSession.findUnique({
      where: { id: parseInt(sessionId, 10) },
    });

    if (!userSession || userSession.userId !== parseInt(username, 10)) {
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

  private async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }
}
