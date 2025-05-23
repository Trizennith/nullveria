import { JwtStatelessGuard } from '../../../src/api/auth/guards/auth.stateless.guard';
import { AuthService } from '../../../src/api/auth/auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../../src/databases/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import Generator from 'src/common/utils/generator';
import { JwtStrategy } from '../../../src/api/auth/jwt.strategy';
import { IncomingHttpHeaders } from 'http';
import { JsonWebTokenError } from 'jsonwebtoken';
import { COOKIE_ATTR_JWT_FINGERPRINT } from 'src/api/auth/constants/constant';

class MockPrismaService {
  user = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn().mockReturnValue({
      id: '1',
      email: 'test@email.com',
      password: '$2a$10$R7c2VWp9hc3XF5W6Iuiel.aqWUr8M/YaxbcFX.eTI7xhx18GXH27K', // hashed 'password'
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: 'user',
      isActive: true,
      isVerified: true,
      phoneNumber: '1234567890',
      userName: 'johndoe',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };

  userSession = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };

  userAddress = {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
  };

  refreshToken = {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };

  $disconnect = jest.fn();
}

function mockRequest(
  headers: IncomingHttpHeaders,
  cookies: Record<string, string>,
): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getType: jest.fn(),
    switchToRpc: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => ({
        headers: headers,
        cookies: cookies,
      })),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    })),
    switchToWs: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('JwtContextGuard', () => {
  let guard: JwtStatelessGuard;
  let authService: AuthService;
  let jwtFingerPrint: string;
  let jwtAccessToken: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStatelessGuard,
        JwtService,
        JwtStrategy,
        { provide: PrismaService, useClass: MockPrismaService },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
    guard = new JwtStatelessGuard(authService);

    const mockUserSession = await authService.login(
      {
        email: 'test@email.com',
        password: 'password',
        ipAddress: '',
        userAgent: 'Mozilla/5.0',
      },
      Generator.generateUniqueID(),
    );

    jwtAccessToken = mockUserSession.sessionData.accessToken;
    jwtFingerPrint = mockUserSession.jwtRawFgpCtx;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw UnauthorizedException if no token', () => {
    const context = mockRequest(
      { authorization: 'Bearer ' },
      { [COOKIE_ATTR_JWT_FINGERPRINT.JWT]: jwtFingerPrint },
    );

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should return false if no usr-ctx cookie or ctxHash', () => {
    const context = mockRequest(
      { authorization: 'Bearer ' + jwtAccessToken },
      { [COOKIE_ATTR_JWT_FINGERPRINT.JWT]: '' },
    );

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return true if ctxHash matches cookie hash', () => {
    const context = mockRequest(
      { authorization: 'Bearer ' + jwtAccessToken },
      { [COOKIE_ATTR_JWT_FINGERPRINT.JWT]: jwtFingerPrint },
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return error if JWT signing key was tampered.', () => {
    const tamperedJWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiIxIiwicm9sZSI6InVzZXIiLCJleHBJblNlY29uZHMiOjE3NDc0NDg2NzcsImN0eEhhc2giOiJlODFlYzMxNjA2MTljOWQ1MjBjY
    jhmMjVlOTEyNjQ1M2Q1MjMzMGU4NDlkOTk3ZmUyN2Y0OGE0ZTNiYTJhYTM5IiwiaWF0IjoxNzQ3NDQ3Nzc
    3LCJleHAiOjE3NDc0NDg2Nzd9.iDIT7YHVakWQKZ1gw11c9YrBmtnnayFFen9mVQooRzQ`;

    const context = mockRequest(
      { authorization: 'Bearer ' + tamperedJWT },
      { [COOKIE_ATTR_JWT_FINGERPRINT.JWT]: jwtFingerPrint },
    );
    console.log(jwtAccessToken);

    expect(() => guard.canActivate(context)).toThrow(JsonWebTokenError);
  });

  it('should return false if usr-ctx (jwt fingerprint) does not match.', () => {
    const malformedFingerPrint = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'; //hashed of string 'test'
    const context = mockRequest(
      { authorization: 'Bearer ' + jwtAccessToken },
      { [COOKIE_ATTR_JWT_FINGERPRINT.JWT]: malformedFingerPrint },
    );

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return false if usr-ctx (jwt fingerprint) does not exist in cookie.', () => {
    const context = mockRequest({ authorization: 'Bearer ' + jwtAccessToken }, { '': '' });

    expect(guard.canActivate(context)).toBe(false);
  });
});
