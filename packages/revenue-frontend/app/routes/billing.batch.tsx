/**
 * Batch Billing Route
 */

import { useNavigate } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "~/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { toast } from "sonner";
import { useBatchBilling } from "~/lib/api/hooks/use-billing";
import { AlertCircle } from "lucide-react";

const batchFormSchema = z.object({
  billingPeriodStart: z.string().min(1, "Billing period start is required"),
  billingPeriodEnd: z.string().min(1, "Billing period end is required"),
  accountIds: z.string().optional(),
  contractStatus: z
    .enum(["active", "inactive", "expired", "cancelled"])
    .optional(),
});

type BatchFormData = z.infer<typeof batchFormSchema>;

export default function BatchBillingRoute() {
  const navigate = useNavigate();
  const batchBilling = useBatchBilling();

  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: {
      billingPeriodStart: new Date().toISOString().split("T")[0],
      billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      accountIds: "",
      contractStatus: undefined,
    },
  });

  const handleSubmit = async (data: BatchFormData) => {
    try {
      const payload = {
        ...data,
        accountIds: data.accountIds
          ? data.accountIds.split(",").map((id) => id.trim())
          : undefined,
      };

      const response = await batchBilling.mutateAsync(payload);
      toast.success("Batch billing job queued");
      navigate(`/billing/jobs/${response.data.jobId}`);
    } catch (error) {
      toast.error("Failed to queue batch billing");
      console.error(error);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Batch Billing"
        description="Generate invoices for multiple contracts"
      />

      <div className="mt-6 max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Asynchronous Processing</p>
              <p>
                Batch billing is always processed asynchronously. You'll be
                redirected to the job status page to track progress.
              </p>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="billingPeriodStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Period Start *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Start date of the billing period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billingPeriodEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Period End *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      End date of the billing period
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Status (Optional)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "all" ? undefined : value)}
                      defaultValue={field.value || "all"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Filter contracts by status (default: all)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account IDs (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="acc-123, acc-456, acc-789"
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of account IDs to bill (leave empty
                      for all accounts)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/billing")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={batchBilling.isPending}>
                  {batchBilling.isPending
                    ? "Queueing..."
                    : "Queue Batch Billing"}
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </AppShell>
  );
}
