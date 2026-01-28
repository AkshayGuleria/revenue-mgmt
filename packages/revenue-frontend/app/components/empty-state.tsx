/**
 * Empty State Component
 * Placeholder for empty lists or missing data
 */

import type { ReactNode } from "react";
import { FileX } from "lucide-react";
import { Button } from "~/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-32 h-32 mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
        <div className="text-gray-400">
          {icon || <FileX className="h-16 w-16" />}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-base text-gray-600 max-w-md mb-8">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          size="lg"
          className="gap-2 hover:scale-105 hover:shadow-lg transition-all duration-200"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
