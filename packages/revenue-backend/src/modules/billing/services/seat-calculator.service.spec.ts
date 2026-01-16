import { Test, TestingModule } from '@nestjs/testing';
import { SeatCalculatorService } from './seat-calculator.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('SeatCalculatorService', () => {
  let service: SeatCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeatCalculatorService],
    }).compile();

    service = module.get<SeatCalculatorService>(SeatCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSeatPricing', () => {
    it('should calculate pricing without volume tiers', () => {
      const result = service.calculateSeatPricing(
        50,
        new Decimal(100),
        undefined,
      );

      expect(result.seatCount).toBe(50);
      expect(result.pricePerSeat.toString()).toBe('100');
      expect(result.subtotal.toString()).toBe('5000');
      expect(result.appliedTier).toBeUndefined();
    });

    it('should calculate pricing with empty volume tiers array', () => {
      const result = service.calculateSeatPricing(50, new Decimal(100), []);

      expect(result.seatCount).toBe(50);
      expect(result.pricePerSeat.toString()).toBe('100');
      expect(result.subtotal.toString()).toBe('5000');
      expect(result.appliedTier).toBeUndefined();
    });

    it('should apply volume tier for 1-10 seats', () => {
      const volumeTiers = [
        { minSeats: 1, maxSeats: 10, pricePerSeat: 100 },
        { minSeats: 11, maxSeats: 50, pricePerSeat: 90 },
        { minSeats: 51, maxSeats: null, pricePerSeat: 80 },
      ];

      const result = service.calculateSeatPricing(
        5,
        new Decimal(100),
        volumeTiers,
      );

      expect(result.seatCount).toBe(5);
      expect(result.pricePerSeat.toString()).toBe('100');
      expect(result.subtotal.toString()).toBe('500');
      expect(result.appliedTier).toEqual(volumeTiers[0]);
    });

    it('should apply volume tier for 11-50 seats', () => {
      const volumeTiers = [
        { minSeats: 1, maxSeats: 10, pricePerSeat: 100 },
        { minSeats: 11, maxSeats: 50, pricePerSeat: 90 },
        { minSeats: 51, maxSeats: null, pricePerSeat: 80 },
      ];

      const result = service.calculateSeatPricing(
        25,
        new Decimal(100),
        volumeTiers,
      );

      expect(result.seatCount).toBe(25);
      expect(result.pricePerSeat.toString()).toBe('90');
      expect(result.subtotal.toString()).toBe('2250');
      expect(result.appliedTier).toEqual(volumeTiers[1]);
    });

    it('should apply volume tier for 51+ seats (unlimited max)', () => {
      const volumeTiers = [
        { minSeats: 1, maxSeats: 10, pricePerSeat: 100 },
        { minSeats: 11, maxSeats: 50, pricePerSeat: 90 },
        { minSeats: 51, maxSeats: null, pricePerSeat: 80 },
      ];

      const result = service.calculateSeatPricing(
        100,
        new Decimal(100),
        volumeTiers,
      );

      expect(result.seatCount).toBe(100);
      expect(result.pricePerSeat.toString()).toBe('80');
      expect(result.subtotal.toString()).toBe('8000');
      expect(result.appliedTier).toEqual(volumeTiers[2]);
    });

    it('should fall back to base price if no tier matches', () => {
      const volumeTiers = [
        { minSeats: 10, maxSeats: 50, pricePerSeat: 90 },
        { minSeats: 51, maxSeats: 100, pricePerSeat: 80 },
      ];

      const result = service.calculateSeatPricing(
        5,
        new Decimal(100),
        volumeTiers,
      );

      expect(result.seatCount).toBe(5);
      expect(result.pricePerSeat.toString()).toBe('100');
      expect(result.subtotal.toString()).toBe('500');
      expect(result.appliedTier).toBeUndefined();
    });

    it('should handle exact boundary values', () => {
      const volumeTiers = [
        { minSeats: 1, maxSeats: 10, pricePerSeat: 100 },
        { minSeats: 11, maxSeats: 50, pricePerSeat: 90 },
      ];

      // Test lower boundary
      const result1 = service.calculateSeatPricing(
        10,
        new Decimal(100),
        volumeTiers,
      );
      expect(result1.appliedTier).toEqual(volumeTiers[0]);

      // Test upper boundary
      const result2 = service.calculateSeatPricing(
        11,
        new Decimal(100),
        volumeTiers,
      );
      expect(result2.appliedTier).toEqual(volumeTiers[1]);

      // Test exact match on max
      const result3 = service.calculateSeatPricing(
        50,
        new Decimal(100),
        volumeTiers,
      );
      expect(result3.appliedTier).toEqual(volumeTiers[1]);
    });

    it('should handle unsorted volume tiers', () => {
      const volumeTiers = [
        { minSeats: 51, maxSeats: null, pricePerSeat: 80 },
        { minSeats: 1, maxSeats: 10, pricePerSeat: 100 },
        { minSeats: 11, maxSeats: 50, pricePerSeat: 90 },
      ];

      const result = service.calculateSeatPricing(
        25,
        new Decimal(100),
        volumeTiers,
      );

      expect(result.pricePerSeat.toString()).toBe('90');
    });

    it('should calculate decimal seat quantities', () => {
      const result = service.calculateSeatPricing(
        10.5,
        new Decimal(100),
        undefined,
      );

      expect(result.seatCount).toBe(10.5);
      expect(result.subtotal.toString()).toBe('1050');
    });

    it('should handle zero seats', () => {
      const result = service.calculateSeatPricing(
        0,
        new Decimal(100),
        undefined,
      );

      expect(result.seatCount).toBe(0);
      expect(result.subtotal.toString()).toBe('0');
    });
  });

  describe('calculateProration', () => {
    it('should calculate full period proration', () => {
      const fullAmount = new Decimal(1200);
      const totalDays = 365;
      const usedDays = 365;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      expect(result.toString()).toBe('1200');
    });

    it('should calculate half period proration', () => {
      const fullAmount = new Decimal(1200);
      const totalDays = 365;
      const usedDays = 182;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      // 1200 * 182 / 365 = ~598.36
      expect(parseFloat(result.toString())).toBeCloseTo(598.36, 2);
    });

    it('should calculate quarter period proration', () => {
      const fullAmount = new Decimal(1200);
      const totalDays = 365;
      const usedDays = 91;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      // 1200 * 91 / 365 = ~299.18
      expect(parseFloat(result.toString())).toBeCloseTo(299.18, 2);
    });

    it('should return zero for zero total days', () => {
      const fullAmount = new Decimal(1200);
      const totalDays = 0;
      const usedDays = 30;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      expect(result.toString()).toBe('0');
    });

    it('should return zero for zero used days', () => {
      const fullAmount = new Decimal(1200);
      const totalDays = 365;
      const usedDays = 0;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      expect(result.toString()).toBe('0');
    });

    it('should return zero for negative days', () => {
      const fullAmount = new Decimal(1200);
      const totalDays = 365;
      const usedDays = -10;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      expect(result.toString()).toBe('0');
    });

    it('should handle single day proration', () => {
      const fullAmount = new Decimal(30);
      const totalDays = 30;
      const usedDays = 1;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      expect(result.toString()).toBe('1');
    });

    it('should handle precise decimal calculations', () => {
      const fullAmount = new Decimal(99.99);
      const totalDays = 30;
      const usedDays = 15;

      const result = service.calculateProration(
        fullAmount,
        totalDays,
        usedDays,
      );

      // 99.99 * 15 / 30 = 49.995
      expect(result.toString()).toBe('49.995');
    });
  });
});
