/**
 * Data Table Component
 * Reusable table with sorting, pagination, and loading states
 */

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PagingObject } from "~/types/api";

export interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  paging?: PagingObject;
  isLoading?: boolean;
  onPageChange?: (offset: number) => void;
  emptyState?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  paging,
  isLoading,
  onPageChange,
  emptyState,
}: DataTableProps<T>) {
  // Loading state
  if (isLoading) {
    return (
      <div className="rounded-lg border-0 shadow-lg overflow-hidden bg-white animate-pulse">
        {/* Table Header Skeleton */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200 p-4">
          <div className="grid grid-cols-6 gap-4">
            {columns.map((col, idx) => (
              <Skeleton key={idx} className="h-5 w-full bg-gray-300" />
            ))}
          </div>
        </div>
        {/* Table Body Skeleton */}
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                {columns.map((col, idx) => (
                  <Skeleton key={idx} className="h-6 w-full bg-gray-200" />
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
          <Skeleton className="h-10 w-32 bg-gray-300" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 bg-gray-300" />
            <Skeleton className="h-10 w-28 bg-gray-300" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return emptyState || <div className="text-center py-8 text-muted-foreground">No data available</div>;
  }

  const hasNextPage = paging?.hasNext ?? false;
  const hasPrevPage = paging?.hasPrev ?? false;
  const currentOffset = paging?.offset ?? 0;
  const limit = paging?.limit ?? 20;
  const total = paging?.total ?? 0;
  const currentPage = Math.floor(currentOffset / limit) + 1;
  const totalPages = paging?.totalPages ?? Math.ceil(total / limit);

  const handlePrevPage = () => {
    if (hasPrevPage && onPageChange) {
      const newOffset = Math.max(0, currentOffset - limit);
      onPageChange(newOffset);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage && onPageChange) {
      const newOffset = currentOffset + limit;
      onPageChange(newOffset);
    }
  };

  return (
    <div className="space-y-6">
      {/* Table */}
      <div className="rounded-lg border-0 shadow-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-100 hover:to-gray-50 border-b-2 border-gray-200">
              {columns.map((column) => (
                <TableHead key={column.key} className="font-bold text-gray-800 text-sm uppercase tracking-wide">{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={index}
                className={`
                  hover:bg-blue-50 transition-all duration-200 hover:shadow-sm
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                `}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className="text-gray-900 font-medium">{column.cell(item)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Always show when we have paging data */}
      {paging && (
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-100 shadow-md">
          {/* Page Info */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md ring-4 ring-blue-100">
              <span className="text-white font-bold text-lg">{currentPage}</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">
                Page {currentPage} of {totalPages || 1}
              </div>
              {total > 0 && (
                <div className="text-xs text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {currentOffset + 1} - {Math.min(currentOffset + limit, total)}
                  </span>
                  {" "}of{" "}
                  <span className="font-semibold text-gray-900">{total}</span>
                  {" "}results
                </div>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="default"
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className={`
                shadow-md font-semibold transition-all duration-200
                ${hasPrevPage
                  ? 'bg-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white hover:border-transparent hover:scale-105 active:scale-95 text-gray-700 border-blue-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                }
              `}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="h-8 w-px bg-gradient-to-b from-blue-200 via-indigo-200 to-purple-200" />

            <Button
              variant="outline"
              size="default"
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className={`
                shadow-md font-semibold transition-all duration-200
                ${hasNextPage
                  ? 'bg-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white hover:border-transparent hover:scale-105 active:scale-95 text-gray-700 border-blue-200'
                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                }
              `}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
