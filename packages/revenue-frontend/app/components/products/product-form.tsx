/**
 * Product Form Component
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { Product, CreateProductDto, UpdateProductDto } from "~/types/models";
import { PricingModel, BillingInterval } from "~/types/models";

const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  sku: z.string().optional(),
  pricingModel: z.nativeEnum(PricingModel),
  basePrice: z.coerce.number().positive().optional(),
  currency: z.string().optional(),
  minSeats: z.coerce.number().int().positive().optional(),
  maxSeats: z.coerce.number().int().positive().optional(),
  seatIncrement: z.coerce.number().int().positive().optional(),
  billingInterval: z.nativeEnum(BillingInterval).optional(),
  active: z.boolean().optional(),
  isAddon: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: CreateProductDto | UpdateProductDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode: "create" | "edit";
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading,
  mode,
}: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      sku: product?.sku || "",
      pricingModel: product?.pricingModel || PricingModel.SEAT_BASED,
      basePrice: product?.basePrice,
      currency: product?.currency || "USD",
      minSeats: product?.minSeats || 1,
      maxSeats: product?.maxSeats,
      seatIncrement: product?.seatIncrement || 1,
      billingInterval: product?.billingInterval || BillingInterval.MONTHLY,
      active: product?.active ?? true,
      isAddon: product?.isAddon ?? false,
    },
  });

  const handleSubmit = (values: ProductFormValues) => {
    onSubmit(values as CreateProductDto | UpdateProductDto);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Basic Information</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enterprise Plan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <textarea
                    className="w-full min-h-[80px] p-2 border rounded-md"
                    placeholder="Product description..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <FormControl>
                    <Input placeholder="PROD-ENT-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="USD" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium">Pricing Configuration</h3>

          <div className="grid grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="pricingModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing Model *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={PricingModel.SEAT_BASED}>Seat Based</SelectItem>
                      <SelectItem value={PricingModel.FLAT_FEE}>Flat Fee</SelectItem>
                      <SelectItem value={PricingModel.VOLUME_TIERED}>Volume Tiered</SelectItem>
                      <SelectItem value={PricingModel.CUSTOM}>Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Interval</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={BillingInterval.MONTHLY}>Monthly</SelectItem>
                      <SelectItem value={BillingInterval.QUARTERLY}>Quarterly</SelectItem>
                      <SelectItem value={BillingInterval.SEMI_ANNUAL}>Semi-Annual</SelectItem>
                      <SelectItem value={BillingInterval.ANNUAL}>Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="basePrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="99.00" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>Base price per billing interval</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium">Seat Configuration (For Seat-Based Pricing)</h3>

          <div className="grid grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="minSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Seats</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxSeats"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Seats</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seatIncrement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seat Increment</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium">Options</h3>

          <div className="flex items-center space-x-8">
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                  <FormLabel className="!mt-0">Active</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAddon"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                  <FormLabel className="!mt-0">Is Add-on</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="hover:scale-105 active:scale-95 transition-transform duration-200">
            {isLoading ? "Saving..." : mode === "create" ? "Create Product" : "Update Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
