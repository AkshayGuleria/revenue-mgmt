/**
 * Billing API Hooks
 * TanStack Query hooks for billing operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../query-client";
import type {
  Invoice,
  GenerateInvoiceDto,
  BatchGenerateInvoicesDto,
  GenerateConsolidatedInvoiceDto,
  BillingJob,
  QueueStats,
} from "~/types/models";

/**
 * Generate invoice from contract (synchronous)
 */
export function useGenerateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateInvoiceDto) => {
      const response = await apiClient.post<Invoice>(
        "/api/billing/generate",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
    },
  });
}

/**
 * Queue invoice generation (asynchronous)
 */
export function useQueueInvoice() {
  return useMutation({
    mutationFn: async (data: GenerateInvoiceDto) => {
      const response = await apiClient.post<{ jobId: string; status: string }>(
        "/api/billing/queue",
        data
      );
      return response;
    },
  });
}

/**
 * Queue batch billing
 */
export function useBatchBilling() {
  return useMutation({
    mutationFn: async (data: BatchGenerateInvoicesDto) => {
      const response = await apiClient.post<{ jobId: string; status: string }>(
        "/api/billing/batch",
        data
      );
      return response;
    },
  });
}

/**
 * Generate consolidated invoice (synchronous)
 */
export function useGenerateConsolidatedInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: GenerateConsolidatedInvoiceDto) => {
      const response = await apiClient.post<Invoice>(
        "/api/billing/consolidated",
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
    },
  });
}

/**
 * Queue consolidated invoice generation (asynchronous)
 */
export function useQueueConsolidatedInvoice() {
  return useMutation({
    mutationFn: async (data: GenerateConsolidatedInvoiceDto) => {
      const response = await apiClient.post<{ jobId: string; status: string }>(
        "/api/billing/consolidated/queue",
        data
      );
      return response;
    },
  });
}

/**
 * Get billing job status
 */
export function useBillingJob(jobId: string) {
  return useQuery({
    queryKey: queryKeys.billing.job(jobId),
    queryFn: async () => {
      const response = await apiClient.get<BillingJob>(
        `/api/billing/jobs/${jobId}`
      );
      return response;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data?.data as BillingJob | undefined;
      // Poll every 2 seconds if job is still running
      return job?.status === "active" || job?.status === "queued" ? 2000 : false;
    },
  });
}

/**
 * Get billing queue statistics
 */
export function useQueueStats() {
  return useQuery({
    queryKey: queryKeys.billing.queueStats(),
    queryFn: async () => {
      const response = await apiClient.get<QueueStats>(
        "/api/billing/queue/stats"
      );
      return response;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

/**
 * Get consolidated billing queue statistics
 */
export function useConsolidatedQueueStats() {
  return useQuery({
    queryKey: queryKeys.billing.consolidatedQueueStats(),
    queryFn: async () => {
      const response = await apiClient.get<QueueStats>(
        "/api/billing/consolidated/queue/stats"
      );
      return response;
    },
    refetchInterval: 5000,
  });
}
