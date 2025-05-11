import {
  Controller,
  Post,
  Get,
  Body,
  BadRequestException,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDtoSchema, LoginDto } from './dto/request/login.dto';
import { RegisterDtoSchema, RegisterDto } from './dto/response/signup.dto';
import { RefreshTokenDtoSchema } from './dto/request/refresh-token';
import { LoginResponseDto } from './dto/response/login.dto';
import { AuthGuard } from './auth.guard';
import { AuthenticatedRequest } from './interfaces/auth-request.type'; // Import the custom type
import { Request as ExpressRequest } from 'express'; // Import Express Request type
import { UserSessionsResponseDto } from './dto/response/sessions-data';
import { ZodError } from 'zod';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async register(@Body() body: any) {
    const parsed = RegisterDtoSchema.safeParse(body);

    if (!parsed.success) {
      throw new ZodError(parsed.error.errors);
    }

    const registerDto: RegisterDto = parsed.data;
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
  async login(@Body() body: any, @Request() req: ExpressRequest): Promise<LoginResponseDto> {
    const parsed = LoginDtoSchema.safeParse(body);

    if (!parsed.success) {
      throw new ZodError(parsed.error.errors);
    }

    const loginDto: LoginDto = parsed.data;
    const returnBody = await this.authService.login(
      loginDto.email,
      loginDto.password,
      req.ip,
      req.headers['user-agent'],
    );

    return {
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
    };
  }

  @Get('auth-sessions')
  @UseGuards(AuthGuard)
  async getSessions(@Req() req: AuthenticatedRequest): Promise<UserSessionsResponseDto> {
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
        data: {
          lastLoginAt: session.lastLoginAt,
          loginCount: session.loginCount,
          userAgent: session.userAgent,
          totalActiveLogin: session.totalActiveLogin,
          loginData: session.loginData?.map((data) => ({
            id: data.id,
            refreshToken: data.refreshToken,
            loginAt: data.loginAt,
            refreshTokenExpiry: data.refreshTokenExpiry,
            sessionId: data.sessionId,
            accessToken: data.accessToken,
            logoutTime: data.logoutTime,
            metadata: data.metadata
              ? {
                  userAgent: data.metadata.userAgent ?? undefined,
                  ipAddress: data.metadata.ipAddress ?? undefined,
                  location: data.metadata.location ?? undefined,
                  additionalInfo: data.metadata.additionalInfo ?? undefined,
                }
              : undefined,
          })),
        },
      };
    } catch {
      throw new BadRequestException('An error occurred while fetching sessions');
    }
  }

  @Get('auth-logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    try {
      const userId = req.user!.userID; // Access the userId from the JWT payload
      const sessionId = req.user!.sessionID; // Access the sessionId from the JWT payload
      const logoutResult = await this.authService.logout(userId, sessionId);
      console.log('Logout result:', logoutResult);

      if (logoutResult) {
        return {
          message: 'Logout successful',
        };
      } else {
        throw new BadRequestException('Logout failed');
      }
    } catch {
      throw new BadRequestException('An error occurred during logout');
    }
  }

  @Post('auth-refresh')
  async refreshSessionToken(@Body() body: any): Promise<{ accessToken: string }> {
    const parsed = RefreshTokenDtoSchema.safeParse(body);

    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }

    return this.authService.refreshAccessToken(parsed.data.refreshToken);
  }
}
