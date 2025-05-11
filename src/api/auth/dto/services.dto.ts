export interface SessionData {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'user' | 'admin' | 'super_admin';
  isActive: boolean;
  isVerified: boolean;
  sessionData: SessionData;
}

export interface SessionResponse {
  lastLoginAt: Date | null | undefined;
  loginCount: number | null | undefined;
  userAgent: string | null | undefined;
  totalActiveLogin: number | null | undefined;
  loginData:
    | Array<{
        id: string | null | undefined;
        refreshToken: string | null | undefined;
        sessionId: string | null | undefined;
        accessToken: string | null | undefined;
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
