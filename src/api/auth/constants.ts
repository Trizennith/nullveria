import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConstants {
  static readonly REFRESH_TOKEN_DAYS_EXPIRY = 7;
  static readonly ACCESS_TOKEN_EXPIRY_MINS = 15; // Access token expiry time
  static readonly REFRESH_TOKEN_EXPIRY = `${AuthConstants.REFRESH_TOKEN_DAYS_EXPIRY}d`; // Refresh token expiry time
  static readonly JWT_REFRESH_SECRET = AuthConstants.getEnvVariable('JWT_REFRESH_SECRET'); // JWT secret
  static readonly JWT_SECRET = AuthConstants.getEnvVariable('JWT_SECRET'); // JWT issuer

  private static getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    return value;
  }
}
