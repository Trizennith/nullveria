import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { TestAppService } from './test-app.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('test-app')
export class TestAppController {
  constructor(private readonly testAppService: TestAppService) {}

  @Get()
  getHello(@Query() queryParams: { id: string; test2: string }, @Request() req: Request): string {
    return this.testAppService.testGet(req, queryParams.id);
  }

  @Get('users')
  @UseGuards(AuthGuard)
  async findAllUsers() {
    return this.testAppService.findAllUsers();
  }

  @Get('user-with-address')
  async getUserWithAddress(@Query('userId') userId: string) {
    return this.testAppService.getUserWithAddress(userId);
  }
}
