import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  Req,
  UseGuards,
  Request,
  Response,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDtoSchema, LoginDto } from './dto/request/login.dto';
import { RefreshTokenDtoSchema } from './dto/request/refresh-token';
import { LoginResponseDto } from './dto/response/login.dto';
import { AuthenticatedRequest } from './dto/auth-request.type'; // Import the custom type
import { Request as ExpressRequest, Response as ExpressResponse } from 'express'; // Import Express Request and Response types
import { ZodError } from 'zod';
import * as crypto from 'crypto';
import { JwtStatelessGuard } from './guards/auth.stateless.guard';
import { UserSessionsResponseBody } from './dto/response/sessions-data';
import { RegisterDto, RegisterDtoSchema } from './dto/request/signup.dto';
import { COOKIE_ATTR_JWT_FINGERPRINT } from './constants/constant';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async register(@Body() body: any) {
    const parsed = RegisterDto.safeParse(body);

    if (!parsed.success) {
      throw new ZodError(parsed.error.errors);
    }

    const registerDto: RegisterDtoSchema = parsed.data;
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.username,
      registerDto.phoneNumber,
    );
  }

  @Post('login')
  async login(
    @Body() body: any,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse<LoginResponseDto>,
  ) {
    const parsed = LoginDtoSchema.safeParse(body);
    const fingerprint = this.generateFingerprint(req);

    if (!parsed.success) {
      throw new ZodError(parsed.error.errors);
    }

    const loginDto: LoginDto = parsed.data;
    const returnBody = await this.authService.login(
      {
        email: loginDto.email,
        password: loginDto.password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
      fingerprint,
    );

    res.cookie(COOKIE_ATTR_JWT_FINGERPRINT.JWT, returnBody.jwtRawFgpCtx, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.cookie(COOKIE_ATTR_JWT_FINGERPRINT.REFRESH_TOKEN, returnBody.jwtRefreshTokenFgp, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    res.status(200).json({
      status: {
        code: 200,
        message: 'Login successful',
        description: 'User logged in successfully',
      },
      data: {
        email: returnBody.email,
        firstName: returnBody.firstName,
        lastName: returnBody.lastName,
        fullName: returnBody.fullName,
        role: returnBody.role,
        isActive: returnBody.isActive,
        isVerified: returnBody.isVerified,
        sessionData: returnBody.sessionData,
      },
    });
  }

  private generateFingerprint(req: ExpressRequest): string {
    const userAgent = req.headers['user-agent'] || crypto.randomUUID(); // fallback
    const ip = this.getClientIp(req) || crypto.randomUUID(); // use random if missing
    const acceptLang = req.headers['accept-language'] || '';
    const randomSalt = crypto.randomUUID(); // increases uniqueness

    const raw = `${userAgent}|${ip}|${acceptLang}|${randomSalt}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private getClientIp(req: ExpressRequest): string | undefined {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket?.remoteAddress;
  }

  @Get('auth-sessions')
  @UseGuards(JwtStatelessGuard)
  async getSessions(@Req() req: AuthenticatedRequest): Promise<UserSessionsResponseBody> {
    try {
      const userId = req.user!.userID; // Access the userId from the JWT payload

      if (!userId) {
        throw new BadRequestException('Invalid or missing User ID in JWT');
      }

      const session = await this.authService.getSessions(userId);
      return {
        status: {
          code: 200,
          message: 'User sessions retrieved successfully',
          description: 'User sessions retrieved successfully',
        },
        data: session,
      };
    } catch {
      throw new BadRequestException('An error occurred while fetching sessions');
    }
  }

  // @Get('auth-logout')
  // @UseGuards(JwtContextGuard)
  // async logout(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
  //   try {
  //     const userName = req.user!.userName; // Access the userId from the JWT payload
  //     const logoutResult = await this.authService.logout(userName, sessionId);
  //     console.log('Logout result:', logoutResult);

  //     if (logoutResult) {
  //       return {
  //         message: 'Logout successful',
  //       };
  //     } else {
  //       throw new BadRequestException('Logout failed');
  //     }
  //   } catch {
  //     throw new BadRequestException('An error occurred during logout');
  //   }
  // }

  @Post('auth-refresh')
  @UseGuards(JwtStatelessGuard)
  async refreshSessionToken(
    @Body() body: any,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ accessToken: string }> {
    const parsed = RefreshTokenDtoSchema.safeParse(body);

    const fingerprint = req.cookies?.[COOKIE_ATTR_JWT_FINGERPRINT.REFRESH_TOKEN] as string;
    const newFingerprint = this.generateFingerprint(req);
    const payload = req.user!;

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    const result = await this.authService.refreshTokens(
      payload,
      parsed.data.refreshToken,
      fingerprint,
      newFingerprint,
    );

    return { accessToken: result.newFingerprint };
  }
}
