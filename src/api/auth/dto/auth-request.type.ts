import { Request } from 'express';

export interface JwtPayload {
  userName: string;
  sessionID: string;
  role: 'user' | 'admin' | 'super_admin'; // Optional role field
  expInSeconds: number;
  ctxHash: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // Add the user property with JwtPayload type
  jwtToken?: string; // Optional property to hold the JWT token
}

export interface LoginDataDto {
  email: string;
  password: string;
  ipAddress: string | null | undefined;
  userAgent: string | null | undefined;
}
