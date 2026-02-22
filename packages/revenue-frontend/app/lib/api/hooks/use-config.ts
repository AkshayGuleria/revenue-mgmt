/**
 * App Config API Hook
 * Fetches backend configuration including default currency
 */

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../query-client";

export interface AppConfig {
  defaultCurrency: string;
  supportedCurrencies: string[];
}

export function useConfig() {
  return useQuery({
    queryKey: queryKeys.config.all,
    queryFn: async () => {
      const response = await apiClient.get<AppConfig>("/api/config");
      return response.data as AppConfig;
    },
    staleTime: 30 * 60 * 1000, // 30 min
    gcTime: 60 * 60 * 1000, // 1 hr
    throwOnError: false, // config failure must not crash app
  });
}
