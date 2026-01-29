/**
 * Search Input Component
 * Debounced search input with clear button
 */

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";

interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  onSearch,
  debounceMs = 500,
  className = "",
}: SearchInputProps) {
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  // Debounce the search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, debounceMs]);

  // Call onSearch when debounced value changes
  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setValue("");
    setDebouncedValue("");
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-10 pr-10 h-11 bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md hover:bg-gray-100"
          >
            <X className="h-4 w-4 text-gray-400" />
          </Button>
        )}
      </div>
      {debouncedValue && debouncedValue !== value && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-500">
          Searching...
        </div>
      )}
    </div>
  );
}
