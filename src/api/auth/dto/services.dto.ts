export interface SessionData {
  accessToken: string;
  refreshToken: string;
}

export type UserRoleTypes = 'user' | 'admin' | 'super_admin';

export interface LoginResultDto {
  jwtRefreshTokenFgp: string;
  jwtRawFgpCtx: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRoleTypes;
  isActive: boolean;
  isVerified: boolean;
  sessionData: SessionData;
}

export interface LoginDataDto {
  id: string | null | undefined;
  sessionId: string;
  fingerprint: string;
  hashedToken: string;
  revoked: boolean;
  loginTime: Date;
  logoutTime: Date | null | undefined;
  ipAddress: string | null | undefined;
  userAgent: string | null | undefined;
  location: string | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  metadata: any | null | undefined;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionsResultDto {
  lastLoginAt: Date | null | undefined;
  loginCount: number | null | undefined;
  totalActiveLogin: number | null | undefined;
  loginData: Array<LoginDataDto> | null | undefined;
}
