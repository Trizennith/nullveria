import { Request } from 'express';

export interface JwtPayload {
  sessionID: string;
  email: string;
  userID: string;
  role: string; // Optional role field
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload; // Add the user property with JwtPayload type
}
