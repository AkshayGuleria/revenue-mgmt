/**
 * Edit Invoice Route
 */

import { useParams, useNavigate } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { InvoiceForm } from "~/components/invoices/invoice-form";
import { useInvoice, useUpdateInvoice } from "~/lib/api/hooks/use-invoices";
import { toast } from "sonner";
import type { UpdateInvoiceDto } from "~/types/models";

export default function EditInvoiceRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useInvoice(id!);
  const updateInvoice = useUpdateInvoice(id!);

  const invoice = data?.data;

  const handleSubmit = async (data: UpdateInvoiceDto) => {
    try {
      await updateInvoice.mutateAsync(data);
      toast.success("Invoice updated successfully");
      navigate(`/invoices/${id}`);
    } catch (error) {
      toast.error("Failed to update invoice");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading invoice...</div>
        </div>
      </AppShell>
    );
  }

  if (!invoice) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Invoice not found</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Edit Invoice"
        description={`Edit invoice ${invoice.invoiceNumber}`}
      />

      <div className="mt-6">
        <InvoiceForm
          invoice={invoice}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/invoices/${id}`)}
          isLoading={updateInvoice.isPending}
        />
      </div>
    </AppShell>
  );
}
