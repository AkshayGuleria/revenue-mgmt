/**
 * Product Details Route
 * Enhanced UX inline with account and contract details view
 */

import { useParams, Link } from "react-router";
import {
  Edit,
  Package,
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Layers,
  Tag,
  FileText,
  CheckCircle,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PageLoader } from "~/components/page-loader";
import { StatusBadge } from "~/components/status-badge";
import { CurrencyDisplay } from "~/components/currency-display";
import { useProduct } from "~/lib/api/hooks/use-products";

export default function ProductDetailsRoute() {
  const params = useParams();
  const productId = params.id!;
  const { data, isLoading } = useProduct(productId);
  const product = data?.data as any;

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader message="Loading product..." />
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Product not found</h2>
          <Link to="/products">
            <Button className="mt-4">Back to Products</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const hasVolumeTiers = product.volumeTiers && Array.isArray(product.volumeTiers) && product.volumeTiers.length > 0;

  return (
    <AppShell>
      <PageHeader
        title={product.name}
        description={`${product.pricingModel.replace(/_/g, " ")} • ${product.sku || `Product ID: ${product.id}`}`}
        actions={
          <Link to={`/products/${productId}/edit`}>
            <Button className="hover:scale-105 active:scale-95 transition-transform duration-200">
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mt-6 mb-8">
        <StatusBadge
          status={product.active ? "active" : "inactive"}
          color={product.active ? "green" : "gray"}
        />
        <span className="text-gray-400">•</span>
        <span className="text-sm text-gray-600 flex items-center gap-2">
          {product.isAddon ? (
            <>
              <Layers className="h-4 w-4" />
              Add-on Product
            </>
          ) : (
            <>
              <Package className="h-4 w-4" />
              Standard Product
            </>
          )}
        </span>
        {product.billingInterval && (
          <>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-600 flex items-center gap-2 capitalize">
              <Calendar className="h-4 w-4" />
              {product.billingInterval.replace(/_/g, " ")}
            </span>
          </>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="pricing" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            Pricing
          </TabsTrigger>
          {hasVolumeTiers && (
            <TabsTrigger value="tiers" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              Volume Tiers
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">Product Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {product.sku && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Tag className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">SKU</p>
                      <p className="text-base font-medium text-gray-900">{product.sku}</p>
                    </div>
                  </div>
                )}

                {product.description && (
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600 mb-1">Description</p>
                      <p className="text-base text-gray-700 leading-relaxed">{product.description}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Pricing Model</p>
                    <p className="text-base font-medium text-gray-900 capitalize">
                      {product.pricingModel.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-1">
                    {product.active ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Product Type</p>
                    <p className="text-base font-medium text-gray-900">
                      {product.isAddon ? "Add-on" : "Standard Product"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat Configuration Card */}
            {(product.minSeats || product.maxSeats || product.seatIncrement) && (
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">Seat Configuration</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {product.minSeats && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Users className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Minimum Seats</p>
                        <p className="text-lg font-bold text-gray-900">{product.minSeats} users</p>
                      </div>
                    </div>
                  )}

                  {product.maxSeats && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Users className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Maximum Seats</p>
                        <p className="text-lg font-bold text-gray-900">{product.maxSeats} users</p>
                      </div>
                    </div>
                  )}

                  {product.seatIncrement && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Seat Increment</p>
                        <p className="text-lg font-bold text-gray-900">{product.seatIncrement}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600" />
            <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Pricing Details</CardTitle>
                  <CardDescription className="text-gray-600">
                    {product.pricingModel.replace(/_/g, " ")} pricing configuration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              {product.basePrice && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Base Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      <CurrencyDisplay amount={product.basePrice} currency={product.currency} />
                    </p>
                  </div>
                </div>
              )}

              {product.currency && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Currency</p>
                    <p className="text-base font-medium text-gray-900">{product.currency}</p>
                  </div>
                </div>
              )}

              {product.billingInterval && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-4 w-4 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Billing Interval</p>
                    <p className="text-base font-medium text-gray-900 capitalize">
                      {product.billingInterval.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasVolumeTiers && (
          <TabsContent value="tiers">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600" />
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">Volume Pricing Tiers</CardTitle>
                    <CardDescription className="text-gray-600">
                      Discounted pricing based on quantity purchased
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {product.volumeTiers.map((tier: any, index: number) => {
                    const colors = [
                      { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "bg-blue-500" },
                      { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: "bg-green-500" },
                      { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", icon: "bg-purple-500" },
                      { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: "bg-amber-500" },
                    ];
                    const color = colors[index % colors.length];

                    return (
                      <div
                        key={index}
                        className={`p-5 rounded-lg border-2 ${color.border} ${color.bg} hover:shadow-md transition-shadow duration-200`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-lg ${color.icon} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-bold text-lg">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-2">
                              <span className={`text-lg font-bold ${color.text}`}>
                                {tier.minQuantity} - {tier.maxQuantity || "∞"} units
                              </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-gray-900">
                                <CurrencyDisplay amount={tier.pricePerUnit} currency={product.currency} />
                              </span>
                              <span className="text-sm text-gray-600">per unit</span>
                            </div>
                          </div>
                          {index > 0 && (
                            <div className="text-right">
                              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm font-semibold">
                                  {(((product.volumeTiers[0].pricePerUnit - tier.pricePerUnit) / product.volumeTiers[0].pricePerUnit) * 100).toFixed(0)}% off
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </AppShell>
  );
}
