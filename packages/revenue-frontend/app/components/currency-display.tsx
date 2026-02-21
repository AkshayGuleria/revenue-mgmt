/**
 * Currency Display Component
 * Formats currency values consistently
 */

import { useConfigStore } from "~/lib/stores/config-store";

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  className,
}: CurrencyDisplayProps) {
  const { defaultCurrency } = useConfigStore();
  const resolvedCurrency = currency ?? defaultCurrency;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: resolvedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return <span className={className}>{formatted}</span>;
}
