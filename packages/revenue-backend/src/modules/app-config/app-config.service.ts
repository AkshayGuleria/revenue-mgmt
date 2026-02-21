import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'SGD',
  'HKD',
  'NZD',
  'MXN',
  'BRL',
  'INR',
  'ZAR',
  'AED',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export interface AppConfigDto {
  defaultCurrency: string;
  supportedCurrencies: string[];
}

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  getConfig(): AppConfigDto {
    return {
      defaultCurrency: this.configService.get<string>(
        'DEFAULT_CURRENCY',
        'EUR',
      ),
      supportedCurrencies: [...SUPPORTED_CURRENCIES],
    };
  }
}
