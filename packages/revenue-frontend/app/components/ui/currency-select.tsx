/**
 * CurrencySelect Component
 * Dropdown for selecting a currency, backed by the config store
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useConfigStore } from "~/lib/stores/config-store";

interface CurrencySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CurrencySelect({
  value,
  onValueChange,
  disabled,
  placeholder = "Select currency",
}: CurrencySelectProps) {
  const { defaultCurrency, supportedCurrencies } = useConfigStore();

  const resolvedValue = value || defaultCurrency;
  const currencies =
    supportedCurrencies.length > 0 ? supportedCurrencies : [defaultCurrency];

  return (
    <Select
      value={resolvedValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency} value={currency}>
            {currency}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
