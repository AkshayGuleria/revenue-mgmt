/**
 * Status Badge Component
 * Displays status with appropriate color coding
 */

import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type StatusColor = "gray" | "green" | "blue" | "yellow" | "red";

const colorVariants: Record<StatusColor, string> = {
  gray: "bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200",
  green: "bg-green-50 text-green-700 hover:bg-green-50 border-green-200",
  blue: "bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200",
  yellow: "bg-yellow-50 text-yellow-700 hover:bg-yellow-50 border-yellow-200",
  red: "bg-red-50 text-red-700 hover:bg-red-50 border-red-200",
};

interface StatusBadgeProps {
  status: string;
  color?: StatusColor;
  className?: string;
}

export function StatusBadge({ status, color = "gray", className }: StatusBadgeProps) {
  return (
    <Badge className={cn(colorVariants[color], "font-semibold shadow-sm", className)} variant="outline">
      {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")}
    </Badge>
  );
}
