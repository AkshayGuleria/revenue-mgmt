import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  const mockAppService = {
    getHealth: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    service = module.get<AppService>(AppService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStatus', () => {
    it('should return API health status', () => {
      const mockHealth = {
        status: 'ok',
        timestamp: '2026-01-16T00:00:00.000Z',
        service: 'revenue-backend',
        version: '1.0.0',
        environment: 'test',
      };

      mockAppService.getHealth.mockReturnValue(mockHealth);

      const result = controller.getStatus();

      expect(result).toEqual(mockHealth);
      expect(service.getHealth).toHaveBeenCalledTimes(1);
    });
  });
});
