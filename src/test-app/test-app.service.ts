import { Injectable } from '@nestjs/common';
import { PrismaService } from '../databases/prisma/prisma.service';

@Injectable()
export class TestAppService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany(); // Fetch all users
  }

  async getUserWithAddress(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      include: { address: true }, // Include the address relation
    });
  }

  testGet(req: Request, id: string | number): string {
    return `Hello World! ${req.url} ${id}`;
  }
}
