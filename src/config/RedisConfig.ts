import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const RedisOptions: CacheModuleAsyncOptions = {
  isGlobal: true,
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const redisClient = new Redis({
      host: configService.get<string>('REDIS_HOST') || 'localhost',
      port: parseInt(configService.get<string>('REDIS_PORT') || '6379', 10),
      password: configService.get<string>('REDIS_PASSWORD') || undefined,
    });

    return {
      store: {
        get: (key: string) => redisClient.get(key),
        set: (key: string, value: any, options?: { ttl: number }) =>
          redisClient.set(key, value, 'EX', options?.ttl || 0),
        del: (key: string) => redisClient.del(key),
      },
    };
  },
  inject: [ConfigService],
};
