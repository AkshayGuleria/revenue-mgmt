import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

interface VolumeTier {
  minSeats: number;
  maxSeats: number | null;
  pricePerSeat: number;
}

interface SeatPricingResult {
  seatCount: number;
  pricePerSeat: Decimal;
  subtotal: Decimal;
  appliedTier?: VolumeTier;
}

@Injectable()
export class SeatCalculatorService {
  /**
   * Calculate seat-based pricing with volume discounts
   */
  calculateSeatPricing(
    seatCount: number,
    basePrice: Decimal,
    volumeTiers?: VolumeTier[],
  ): SeatPricingResult {
    if (!volumeTiers || volumeTiers.length === 0) {
      // No volume tiers, use base price
      const subtotal = new Decimal(seatCount).mul(basePrice);
      return {
        seatCount,
        pricePerSeat: basePrice,
        subtotal,
      };
    }

    // Find applicable volume tier
    const appliedTier = this.findApplicableTier(seatCount, volumeTiers);

    if (!appliedTier) {
      // No tier found, use base price
      const subtotal = new Decimal(seatCount).mul(basePrice);
      return {
        seatCount,
        pricePerSeat: basePrice,
        subtotal,
      };
    }

    // Calculate with tier pricing
    const pricePerSeat = new Decimal(appliedTier.pricePerSeat);
    const subtotal = new Decimal(seatCount).mul(pricePerSeat);

    return {
      seatCount,
      pricePerSeat,
      subtotal,
      appliedTier,
    };
  }

  /**
   * Find the applicable volume tier for the given seat count
   */
  private findApplicableTier(
    seatCount: number,
    tiers: VolumeTier[],
  ): VolumeTier | null {
    // Sort tiers by minSeats ascending
    const sortedTiers = [...tiers].sort((a, b) => a.minSeats - b.minSeats);

    for (const tier of sortedTiers) {
      const meetsMin = seatCount >= tier.minSeats;
      const meetsMax = tier.maxSeats === null || seatCount <= tier.maxSeats;

      if (meetsMin && meetsMax) {
        return tier;
      }
    }

    return null;
  }

  /**
   * Calculate proration for mid-period changes
   */
  calculateProration(
    fullPeriodAmount: Decimal,
    totalDays: number,
    usedDays: number,
  ): Decimal {
    if (totalDays <= 0 || usedDays <= 0) {
      return new Decimal(0);
    }

    return fullPeriodAmount.mul(usedDays).div(totalDays);
  }
}
