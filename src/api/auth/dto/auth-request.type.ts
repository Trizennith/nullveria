import { Request } from 'express';

export interface JwtPayload {
  userID: string;
  role: 'user' | 'admin' | 'super_admin'; // Optional role field
  expInSeconds: number;
  ctxHash: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // Add the user property with JwtPayload type
}

export interface LoginDataDto {
  email: string;
  password: string;
  ipAddress: string | null | undefined;
  userAgent: string | null | undefined;
}
