import { PrismaClient } from '@prisma/client';

export interface IPrismaService {
  user: PrismaClient['user'];
  userSession: PrismaClient['userSession'];
  userAddress: PrismaClient['userAddress'];
  refreshToken: PrismaClient['refreshToken'];
}
