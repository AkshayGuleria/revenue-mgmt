import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status with correct structure', () => {
      const result = service.getHealth();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'revenue-backend');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment');
    });

    it('should return valid ISO timestamp', () => {
      const result = service.getHealth() as any;
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(result.timestamp);
    });

    it('should use development environment by default', () => {
      delete process.env.NODE_ENV;
      const result = service.getHealth() as any;

      expect(result.environment).toBe('development');
    });

    it('should use NODE_ENV when set', () => {
      process.env.NODE_ENV = 'production';
      const result = service.getHealth() as any;

      expect(result.environment).toBe('production');

      // Cleanup
      process.env.NODE_ENV = 'test';
    });
  });
});
