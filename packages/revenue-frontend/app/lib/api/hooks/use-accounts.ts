/**
 * Accounts API Hooks
 * TanStack Query hooks for account operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../query-client";
import type {
  Account,
  CreateAccountDto,
  UpdateAccountDto,
  AccountHierarchyNode,
} from "~/types/models";
import type { QueryParams } from "~/types/api";

/**
 * Fetch list of accounts with filtering and pagination
 */
export function useAccounts(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.accounts.list(params),
    queryFn: async () => {
      const response = await apiClient.get<Account[]>("/api/accounts", params);
      return response;
    },
  });
}

/**
 * Fetch single account by ID
 */
export function useAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Account>(`/api/accounts/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch account hierarchy tree
 */
export function useAccountHierarchy(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.hierarchy(id),
    queryFn: async () => {
      const response = await apiClient.get<AccountHierarchyNode>(
        `/api/accounts/${id}/hierarchy`
      );
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch direct children of an account
 */
export function useAccountChildren(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.children(id),
    queryFn: async () => {
      const response = await apiClient.get<AccountHierarchyNode[]>(
        `/api/accounts/${id}/children`
      );
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch ancestors of an account
 */
export function useAccountAncestors(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.ancestors(id),
    queryFn: async () => {
      const response = await apiClient.get<AccountHierarchyNode[]>(
        `/api/accounts/${id}/ancestors`
      );
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Fetch descendants of an account
 */
export function useAccountDescendants(id: string) {
  return useQuery({
    queryKey: queryKeys.accounts.descendants(id),
    queryFn: async () => {
      const response = await apiClient.get<AccountHierarchyNode[]>(
        `/api/accounts/${id}/descendants`
      );
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Create new account
 */
export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountDto) => {
      const response = await apiClient.post<Account>("/api/accounts", data);
      return response;
    },
    onSuccess: () => {
      // Invalidate accounts list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() });
    },
  });
}

/**
 * Update existing account
 */
export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAccountDto) => {
      const response = await apiClient.patch<Account>(
        `/api/accounts/${id}`,
        data
      );
      return response;
    },
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.accounts.detail(id) });

      // Snapshot previous value
      const previousAccount = queryClient.getQueryData(queryKeys.accounts.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.accounts.detail(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            ...newData,
          },
        };
      });

      return { previousAccount };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousAccount) {
        queryClient.setQueryData(queryKeys.accounts.detail(id), context.previousAccount);
      }
    },
    onSuccess: () => {
      // Invalidate specific account and list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() });
    },
  });
}

/**
 * Delete account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<void>(`/api/accounts/${id}`);
      return response;
    },
    onSuccess: () => {
      // Invalidate accounts list queries
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts.lists() });
    },
  });
}
