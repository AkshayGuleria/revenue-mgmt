/**
 * Create Invoice Route
 */

import { useNavigate } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { InvoiceForm } from "~/components/invoices/invoice-form";
import { useCreateInvoice } from "~/lib/api/hooks/use-invoices";
import { toast } from "sonner";
import type { CreateInvoiceDto } from "~/types/models";

export default function NewInvoiceRoute() {
  const navigate = useNavigate();
  const createInvoice = useCreateInvoice();

  const handleSubmit = async (data: CreateInvoiceDto) => {
    try {
      const response = await createInvoice.mutateAsync(data);
      toast.success("Invoice created successfully");
      navigate(`/invoices/${response.data.id}`);
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error(error);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Create Invoice"
        description="Create a new invoice manually"
      />

      <div className="mt-6">
        <InvoiceForm
          onSubmit={handleSubmit}
          onCancel={() => navigate("/invoices")}
          isLoading={createInvoice.isPending}
        />
      </div>
    </AppShell>
  );
}
