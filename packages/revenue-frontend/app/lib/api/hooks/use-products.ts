/**
 * Products API Hooks
 * TanStack Query hooks for product operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { queryKeys } from "../query-client";
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
} from "~/types/models";
import type { QueryParams } from "~/types/api";

/**
 * Fetch list of products with filtering and pagination
 */
export function useProducts(params?: QueryParams) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: async () => {
      const response = await apiClient.get<Product[]>("/api/products", params);
      return response;
    },
  });
}

/**
 * Fetch single product by ID
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Product>(`/api/products/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Create new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProductDto) => {
      const response = await apiClient.post<Product>("/api/products", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Update existing product
 */
export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProductDto) => {
      const response = await apiClient.patch<Product>(
        `/api/products/${id}`,
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}

/**
 * Delete product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete<void>(`/api/products/${id}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
    },
  });
}
