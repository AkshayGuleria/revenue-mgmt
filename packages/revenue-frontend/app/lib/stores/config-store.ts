/**
 * Config Store
 * Manages backend-driven configuration (default currency, supported currencies)
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigState {
  defaultCurrency: string;
  supportedCurrencies: string[];
  isLoaded: boolean;

  // Actions
  setConfig: (defaultCurrency: string, supportedCurrencies: string[]) => void;
  reset: () => void;
}

const INITIAL_DEFAULT_CURRENCY = "USD";

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      defaultCurrency: INITIAL_DEFAULT_CURRENCY,
      supportedCurrencies: [],
      isLoaded: false,

      setConfig: (defaultCurrency, supportedCurrencies) =>
        set({ defaultCurrency, supportedCurrencies, isLoaded: true }),

      reset: () =>
        set({
          defaultCurrency: INITIAL_DEFAULT_CURRENCY,
          supportedCurrencies: [],
          isLoaded: false,
        }),
    }),
    {
      name: "config-storage",
    }
  )
);
