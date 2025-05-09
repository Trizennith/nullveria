import { Test, TestingModule } from '@nestjs/testing';
import { TestAppController } from '../test-app.controller';

describe('TestAppController', () => {
  let controller: TestAppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestAppController],
    }).compile();

    controller = module.get<TestAppController>(TestAppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
