/**
 * Invoices List Route
 */

import { useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { DataTable, type Column } from "~/components/data-table";
import { StatusBadge } from "~/components/status-badge";
import { EmptyState } from "~/components/empty-state";
import { DateDisplay } from "~/components/date-display";
import { CurrencyDisplay } from "~/components/currency-display";
import { useInvoices } from "~/lib/api/hooks/use-invoices";
import type { Invoice } from "~/types/models";
import { PAGINATION } from "~/lib/constants";

export default function InvoicesListRoute() {
  const [offset, setOffset] = useState(PAGINATION.DEFAULT_OFFSET);
  const [limit] = useState(PAGINATION.DEFAULT_LIMIT);

  const { data, isLoading } = useInvoices({
    "offset[eq]": offset,
    "limit[eq]": limit,
  });

  const columns: Column<Invoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice Number",
      cell: (invoice) => (
        <Link
          to={`/invoices/${invoice.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {invoice.invoiceNumber}
        </Link>
      ),
    },
    {
      key: "account",
      header: "Account",
      cell: (invoice) => (
        <Link
          to={`/accounts/${invoice.accountId}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {invoice.account?.accountName || invoice.accountId}
        </Link>
      ),
    },
    {
      key: "issueDate",
      header: "Issue Date",
      cell: (invoice) => <DateDisplay date={invoice.issueDate} />,
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (invoice) => <DateDisplay date={invoice.dueDate} />,
    },
    {
      key: "total",
      header: "Total",
      cell: (invoice) => (
        <CurrencyDisplay amount={invoice.total} currency={invoice.currency} />
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (invoice) => {
        const colorMap: Record<string, "green" | "gray" | "yellow" | "red" | "blue"> = {
          draft: "gray",
          sent: "blue",
          paid: "green",
          overdue: "red",
          cancelled: "gray",
          void: "gray",
        };
        return (
          <StatusBadge
            status={invoice.status}
            color={colorMap[invoice.status]}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (invoice) => (
        <Link to={`/invoices/${invoice.id}/edit`}>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  const invoices = Array.isArray(data?.data) ? data.data : [];

  return (
    <AppShell>
      <PageHeader
        title="Invoices"
        description="Manage invoices and track payments"
        actions={
          <Link to="/invoices/new">
            <Button className="hover:scale-105 active:scale-95 transition-transform duration-200">
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        }
      />

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={invoices}
          paging={data?.paging}
          isLoading={isLoading}
          onPageChange={setOffset}
          emptyState={
            <EmptyState
              title="No invoices found"
              description="Get started by creating your first invoice"
              action={{
                label: "Create Invoice",
                onClick: () => (window.location.href = "/invoices/new"),
              }}
            />
          }
        />
      </div>
    </AppShell>
  );
}
