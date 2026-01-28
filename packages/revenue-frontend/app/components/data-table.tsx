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
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
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
      <div className="rounded-lg border shadow-sm overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              {columns.map((column) => (
                <TableHead key={column.key} className="font-semibold text-gray-700">{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index} className="hover:bg-blue-50 transition-colors">
                {columns.map((column) => (
                  <TableCell key={column.key}>{column.cell(item)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paging && (paging.total !== null || paging.hasNext !== null) && (
        <div className="flex items-center justify-between px-2 py-4 bg-gray-50 rounded-b-lg border-t">
          <div className="text-sm font-medium text-gray-600">
            {total > 0 && (
              <span>
                Showing <span className="font-semibold text-gray-900">{currentOffset + 1}</span> to{" "}
                <span className="font-semibold text-gray-900">{Math.min(currentOffset + limit, total)}</span> of{" "}
                <span className="font-semibold text-gray-900">{total}</span> results
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={!hasPrevPage}
              className="shadow-sm hover:bg-white disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasNextPage}
              className="shadow-sm hover:bg-white disabled:opacity-50"
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
