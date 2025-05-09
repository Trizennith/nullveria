import { Test, TestingModule } from '@nestjs/testing';
import { TestAppService } from '../test-app.service';

describe('TestAppService', () => {
  let service: TestAppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestAppService],
    }).compile();

    service = module.get<TestAppService>(TestAppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
