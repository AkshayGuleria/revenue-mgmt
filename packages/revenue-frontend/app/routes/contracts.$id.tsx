/**
 * Contract Details Route
 */

import { useParams, Link } from "react-router";
import { Edit } from "lucide-react";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PageLoader } from "~/components/page-loader";
import { StatusBadge } from "~/components/status-badge";
import { DateDisplay } from "~/components/date-display";
import { CurrencyDisplay } from "~/components/currency-display";
import { useContract } from "~/lib/api/hooks/use-contracts";

export default function ContractDetailsRoute() {
  const params = useParams();
  const contractId = params.id!;

  const { data, isLoading } = useContract(contractId);
  const contract = data?.data as any;

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader message="Loading contract details..." />
      </AppShell>
    );
  }

  if (!contract) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Contract not found</h2>
          <Link to="/contracts">
            <Button className="mt-4">Back to Contracts</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const colorMap: Record<string, "green" | "gray" | "yellow" | "red" | "blue"> = {
    draft: "gray",
    active: "green",
    expired: "yellow",
    cancelled: "red",
    renewed: "blue",
  };

  return (
    <AppShell>
      <PageHeader
        title={contract.contractNumber}
        description={`Contract for ${contract.account?.accountName || contract.accountId}`}
        actions={
          <Link to={`/contracts/${contractId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Contract
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 mt-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <StatusBadge status={contract.status} color={colorMap[contract.status]} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account</p>
              <Link
                to={`/accounts/${contract.accountId}`}
                className="text-sm hover:underline"
              >
                {contract.account?.accountName || contract.accountId}
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contract Value</p>
              <p className="text-lg font-semibold">
                <CurrencyDisplay amount={contract.contractValue} />
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                <p className="text-sm">
                  <DateDisplay date={contract.startDate} />
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                <p className="text-sm">
                  <DateDisplay date={contract.endDate} />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billing Frequency</p>
              <p className="text-sm capitalize">
                {contract.billingFrequency.replace(/_/g, " ")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
              <p className="text-sm">
                {contract.paymentTerms.replace(/_/g, " ").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Billing in Advance</p>
              <p className="text-sm">{contract.billingInAdvance ? "Yes" : "No"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Seat-Based Pricing */}
        {(contract.seatCount || contract.committedSeats || contract.seatPrice) && (
          <Card>
            <CardHeader>
              <CardTitle>Seat-Based Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contract.seatCount && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current Seats</p>
                  <p className="text-sm">{contract.seatCount}</p>
                </div>
              )}
              {contract.committedSeats && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Committed Seats</p>
                  <p className="text-sm">{contract.committedSeats}</p>
                </div>
              )}
              {contract.seatPrice && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price Per Seat</p>
                  <p className="text-sm">
                    <CurrencyDisplay amount={contract.seatPrice} />
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Renewal Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Renewal Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Auto-Renew</p>
              <p className="text-sm">{contract.autoRenew ? "Enabled" : "Disabled"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Renewal Notice Period</p>
              <p className="text-sm">{contract.renewalNoticeDays} days</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {contract.notes && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Invoices */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {contract._count?.invoices || 0} invoice(s) generated from this contract
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
