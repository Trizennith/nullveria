import { Module } from '@nestjs/common';
import { TestAppService } from './test-app.service';
import { TestAppController } from './test-app.controller';
import { PrismaService } from '../databases/prisma/prisma.service';
import { AuthModule } from 'src/api/auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TestAppController],
  providers: [TestAppService, PrismaService],
})
export class TestAppModule {}
