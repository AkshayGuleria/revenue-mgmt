import { Test, TestingModule } from '@nestjs/testing';
import { AppConfigController } from './app-config.controller';
import { AppConfigService } from './app-config.service';

describe('AppConfigController', () => {
  let controller: AppConfigController;

  const mockAppConfigService = {
    getConfig: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppConfigController],
      providers: [
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    controller = module.get<AppConfigController>(AppConfigController);
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return config wrapped in ADR-003 envelope with null paging', () => {
      const mockConfig = {
        defaultCurrency: 'EUR',
        supportedCurrencies: ['USD', 'EUR', 'GBP'],
      };
      mockAppConfigService.getConfig.mockReturnValue(mockConfig);

      const result = controller.getConfig();

      expect(result).toEqual({
        data: mockConfig,
        paging: {
          offset: null,
          limit: null,
          total: null,
          totalPages: null,
          hasNext: null,
          hasPrev: null,
        },
      });
    });

    it('should call appConfigService.getConfig()', () => {
      mockAppConfigService.getConfig.mockReturnValue({
        defaultCurrency: 'EUR',
        supportedCurrencies: [],
      });

      controller.getConfig();

      expect(mockAppConfigService.getConfig).toHaveBeenCalledTimes(1);
    });
  });
});
