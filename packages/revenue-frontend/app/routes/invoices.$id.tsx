/**
 * Invoice Details Route
 */

import { useParams, useNavigate, Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { StatusBadge } from "~/components/status-badge";
import { DateDisplay } from "~/components/date-display";
import { CurrencyDisplay } from "~/components/currency-display";
import { DataTable, type Column } from "~/components/data-table";
import { useInvoice } from "~/lib/api/hooks/use-invoices";
import { Edit, FileText, Send, DollarSign } from "lucide-react";
import type { InvoiceItem } from "~/types/models";

export default function InvoiceDetailsRoute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useInvoice(id!);

  const invoice = data?.data;

  const columns: Column<InvoiceItem>[] = [
    {
      key: "description",
      header: "Description",
      cell: (item) => (
        <div>
          <div className="font-medium">{item.description}</div>
          {item.productId && (
            <div className="text-sm text-gray-500">
              Product ID: {item.productId}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      cell: (item) => item.quantity,
    },
    {
      key: "unitPrice",
      header: "Unit Price",
      cell: (item) => (
        <CurrencyDisplay
          amount={item.unitPrice}
          currency={invoice?.currency || "USD"}
        />
      ),
    },
    {
      key: "discount",
      header: "Discount",
      cell: (item) =>
        item.discountAmount ? (
          <CurrencyDisplay
            amount={item.discountAmount}
            currency={invoice?.currency || "USD"}
          />
        ) : (
          "-"
        ),
    },
    {
      key: "tax",
      header: "Tax",
      cell: (item) =>
        item.taxAmount ? (
          <CurrencyDisplay
            amount={item.taxAmount}
            currency={invoice?.currency || "USD"}
          />
        ) : (
          "-"
        ),
    },
    {
      key: "lineTotal",
      header: "Line Total",
      cell: (item) => (
        <CurrencyDisplay
          amount={item.lineTotal}
          currency={invoice?.currency || "USD"}
        />
      ),
    },
  ];

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

  const colorMap: Record<
    string,
    "green" | "gray" | "yellow" | "red" | "blue"
  > = {
    draft: "gray",
    sent: "blue",
    paid: "green",
    overdue: "red",
    cancelled: "gray",
    void: "gray",
  };

  return (
    <AppShell>
      <PageHeader
        title={`Invoice ${invoice.invoiceNumber}`}
        description={`Issued on ${new Date(invoice.issueDate).toLocaleDateString()}`}
        actions={
          <div className="flex gap-3">
            <Link to={`/invoices/${id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {invoice.status === "draft" && (
              <Button>
                <Send className="mr-2 h-4 w-4" />
                Send Invoice
              </Button>
            )}
          </div>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Invoice Header */}
        <Card className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Bill To
              </h3>
              <div className="space-y-1">
                <Link
                  to={`/accounts/${invoice.accountId}`}
                  className="text-lg font-semibold hover:underline"
                >
                  {invoice.account?.accountName || invoice.accountId}
                </Link>
                {invoice.account?.primaryContactEmail && (
                  <p className="text-sm text-gray-600">
                    {invoice.account.primaryContactEmail}
                  </p>
                )}
                {invoice.billingAddress && (
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {invoice.billingAddress}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Status:
                </span>
                <div className="mt-1">
                  <StatusBadge
                    status={invoice.status}
                    color={colorMap[invoice.status]}
                  />
                </div>
              </div>

              {invoice.contractId && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Contract:
                  </span>
                  <div className="mt-1">
                    <Link
                      to={`/contracts/${invoice.contractId}`}
                      className="text-sm hover:underline"
                    >
                      {invoice.contractId}
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500">
                  Issue Date:
                </span>
                <div className="mt-1">
                  <DateDisplay date={invoice.issueDate} />
                </div>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-500">
                  Due Date:
                </span>
                <div className="mt-1">
                  <DateDisplay date={invoice.dueDate} />
                </div>
              </div>

              {invoice.paidDate && (
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Paid Date:
                  </span>
                  <div className="mt-1">
                    <DateDisplay date={invoice.paidDate} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Notes
                </h3>
                <p className="text-sm text-gray-600 whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Line Items */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Line Items</h3>
          <DataTable
            columns={columns}
            data={invoice.items || []}
            isLoading={false}
            emptyState={
              <div className="text-center py-8 text-gray-500">
                No line items
              </div>
            }
          />
        </Card>

        {/* Invoice Totals */}
        <Card className="p-6">
          <div className="max-w-md ml-auto space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <CurrencyDisplay
                amount={invoice.subtotal}
                currency={invoice.currency}
              />
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="text-green-600">
                  -
                  <CurrencyDisplay
                    amount={invoice.discountAmount}
                    currency={invoice.currency}
                  />
                </span>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <CurrencyDisplay
                  amount={invoice.taxAmount}
                  currency={invoice.currency}
                />
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <CurrencyDisplay
                amount={invoice.total}
                currency={invoice.currency}
              />
            </div>

            {invoice.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="text-green-600">
                    <CurrencyDisplay
                      amount={invoice.amountPaid}
                      currency={invoice.currency}
                    />
                  </span>
                </div>

                <div className="flex justify-between text-lg font-semibold">
                  <span>Balance Due:</span>
                  <CurrencyDisplay
                    amount={invoice.total - invoice.amountPaid}
                    currency={invoice.currency}
                  />
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Payment History */}
        {invoice.amountPaid > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payment History</h3>
            <div className="text-sm text-gray-500">
              Payment tracking coming in Phase 4
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
