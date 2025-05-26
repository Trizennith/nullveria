import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class JwtTokenRevoker {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  /**
   * Checks if a token is revoked.
   * @param token The JWT token to check.
   * @returns True if the token is revoked, false otherwise.
   */
  public async isTokenRevoked(token: string): Promise<boolean> {
    const isRevoked = await this.cacheManager.get(`revoked_token:${token}`);
    return !!isRevoked; // Return true if token exists in the cache
  }

  /**
   * Revokes a token by adding it to the cache with an expiration time.
   * @param token The JWT token to revoke.
   * @param expiresIn Expiration time in seconds.
   */
  public async revokeToken(token: string, expiresIn: number): Promise<void> {
    await this.cacheManager.set(`revoked_token:${token}`, true, expiresIn);
    console.log(`Token revoked: ${token}`);
  }

  /**
   * Clears all revoked tokens (optional utility method).
   */
  public clearRevokedTokens(): void {
    // This depends on the cache store implementation; Redis supports `flushall`.
    console.log('Clearing all revoked tokens is not directly supported by CacheManager.');
  }
}
