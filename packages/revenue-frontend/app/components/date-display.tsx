/**
 * Date Display Component
 * Formats dates consistently using date-fns
 */

import { format, parseISO } from "date-fns";
import { DATE_FORMATS } from "~/lib/constants";

interface DateDisplayProps {
  date: string | Date;
  formatStr?: keyof typeof DATE_FORMATS;
  className?: string;
}

export function DateDisplay({
  date,
  formatStr = "DISPLAY",
  className,
}: DateDisplayProps) {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const formatted = format(dateObj, DATE_FORMATS[formatStr]);

  return <span className={className}>{formatted}</span>;
}
