/**
 * Page Header Component
 * Reusable page header with title and actions
 */

import type { ReactNode } from "react";
import { Separator } from "~/components/ui/separator";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{title}</h1>
          {description && (
            <p className="text-gray-500 text-lg">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      <Separator className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-0.5" />
    </div>
  );
}
