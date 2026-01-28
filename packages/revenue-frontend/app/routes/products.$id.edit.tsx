/**
 * Edit Product Route
 */

import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { PageLoader } from "~/components/page-loader";
import { ProductForm } from "~/components/products/product-form";
import { useProduct, useUpdateProduct } from "~/lib/api/hooks/use-products";
import type { UpdateProductDto, Product } from "~/types/models";

export default function EditProductRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const productId = params.id!;
  const { data, isLoading } = useProduct(productId);
  const updateMutation = useUpdateProduct(productId);
  const product = data?.data as Product | undefined;

  const handleSubmit = async (data: UpdateProductDto) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Product updated successfully");
      navigate(`/products/${productId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    }
  };

  if (isLoading) return <AppShell><PageLoader message="Loading product..." /></AppShell>;
  if (!product) return <AppShell><div className="text-center py-12"><h2 className="text-2xl font-semibold">Product not found</h2></div></AppShell>;

  return (
    <AppShell>
      <PageHeader title="Edit Product" description={`Editing ${product.name}`} />
      <Card className="mt-6">
        <CardContent className="pt-6">
          <ProductForm
            mode="edit"
            product={product}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/products/${productId}`)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
