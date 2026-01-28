/**
 * Product Details Route
 */

import { useParams, Link } from "react-router";
import { Edit } from "lucide-react";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PageLoader } from "~/components/page-loader";
import { StatusBadge } from "~/components/status-badge";
import { CurrencyDisplay } from "~/components/currency-display";
import { useProduct } from "~/lib/api/hooks/use-products";

export default function ProductDetailsRoute() {
  const params = useParams();
  const productId = params.id!;
  const { data, isLoading } = useProduct(productId);
  const product = data?.data as any;

  if (isLoading) return <AppShell><PageLoader message="Loading product..." /></AppShell>;
  if (!product) return <AppShell><div className="text-center py-12"><h2 className="text-2xl font-semibold">Product not found</h2></div></AppShell>;

  return (
    <AppShell>
      <PageHeader
        title={product.name}
        description={product.sku || `Product ID: ${product.id}`}
        actions={
          <Link to={`/products/${productId}/edit`}>
            <Button><Edit className="mr-2 h-4 w-4" />Edit Product</Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <StatusBadge status={product.active ? "active" : "inactive"} color={product.active ? "green" : "gray"} />
            </div>
            {product.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Type</p>
              <p className="text-sm">{product.isAddon ? "Add-on" : "Standard Product"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pricing Model</p>
              <p className="text-sm capitalize">{product.pricingModel.replace(/_/g, " ")}</p>
            </div>
            {product.basePrice && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Base Price</p>
                <p className="text-lg font-semibold"><CurrencyDisplay amount={product.basePrice} currency={product.currency} /></p>
              </div>
            )}
            {product.billingInterval && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Billing Interval</p>
                <p className="text-sm capitalize">{product.billingInterval.replace(/_/g, " ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {(product.minSeats || product.maxSeats) && (
          <Card>
            <CardHeader><CardTitle>Seat Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {product.minSeats && <div><p className="text-sm font-medium text-muted-foreground">Minimum Seats</p><p className="text-sm">{product.minSeats}</p></div>}
              {product.maxSeats && <div><p className="text-sm font-medium text-muted-foreground">Maximum Seats</p><p className="text-sm">{product.maxSeats}</p></div>}
              {product.seatIncrement && <div><p className="text-sm font-medium text-muted-foreground">Seat Increment</p><p className="text-sm">{product.seatIncrement}</p></div>}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
