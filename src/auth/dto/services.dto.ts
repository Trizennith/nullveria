export interface SessionData {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  isVerified: boolean;
  sessionData: SessionData;
}

export interface SessionsResult {
  lastLoginAt: Date | null | undefined;
  loginCount: number | null | undefined;
  userAgent: string | null | undefined;
  totalActiveLogin: number | null | undefined;
  loginData:
    | Array<{
        loginAt: Date;
        refreshTokenExpiry: Date;
        logoutTime: Date | null | undefined;
        metadata:
          | {
              ipAddress: string | null | undefined;
              userAgent: string | null | undefined;
              location: string | null | undefined;
              additionalInfo: object | null | undefined;
            }
          | null
          | undefined;
      }>
    | null
    | undefined;
}
