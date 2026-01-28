/**
 * Page Loader Component
 * Full-page loading state with spinner
 */

import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-300">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 animate-pulse" />
        <Loader2 className="h-16 w-16 animate-spin text-white absolute inset-0" />
      </div>
      <p className="mt-6 text-base font-medium text-gray-700 animate-pulse">{message}</p>
    </div>
  );
}
