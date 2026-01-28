/**
 * Account Details Route
 * Displays account details, contracts, and invoices
 */

import { useParams, Link } from "react-router";
import { Edit, Building, CreditCard } from "lucide-react";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { PageLoader } from "~/components/page-loader";
import { StatusBadge } from "~/components/status-badge";
import { useAccount } from "~/lib/api/hooks/use-accounts";

export default function AccountDetailsRoute() {
  const params = useParams();
  const accountId = params.id!;

  const { data, isLoading } = useAccount(accountId);
  const account = data?.data as any;

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader message="Loading account details..." />
      </AppShell>
    );
  }

  if (!account) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Account not found</h2>
          <p className="text-muted-foreground mt-2">
            The account you're looking for doesn't exist.
          </p>
          <Link to="/accounts">
            <Button className="mt-4">Back to Accounts</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const colorMap: Record<string, "green" | "gray" | "red"> = {
    active: "green",
    inactive: "gray",
    suspended: "red",
  };

  return (
    <AppShell>
      <PageHeader
        title={account.accountName}
        description={`Account ID: ${account.id}`}
        actions={
          <Link to={`/accounts/${accountId}/edit`}>
            <Button className="hover:scale-105 active:scale-95 transition-transform duration-200">
              <Edit className="mr-2 h-4 w-4" />
              Edit Account
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="details" className="mt-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Account Type
                </p>
                <p className="text-sm capitalize">{account.accountType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status
                </p>
                <StatusBadge
                  status={account.status}
                  color={colorMap[account.status]}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Primary Contact
                </p>
                <p className="text-sm">{account.primaryContactEmail}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Currency
                </p>
                <p className="text-sm">{account.currency}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Terms</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Payment Terms
                </p>
                <p className="text-sm">
                  {account.paymentTerms.replace(/_/g, " ").toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Credit Limit
                </p>
                <p className="text-sm">
                  {account.creditLimit
                    ? `$${account.creditLimit.toLocaleString()}`
                    : "Not set"}
                </p>
              </div>
              {account.taxId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tax ID
                  </p>
                  <p className="text-sm">{account.taxId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing Information */}
          {(account.billingContactName || account.billingAddressLine1) && (
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {account.billingContactName && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Billing Contact
                    </p>
                    <p className="text-sm">{account.billingContactName}</p>
                    {account.billingContactEmail && (
                      <p className="text-sm text-muted-foreground">
                        {account.billingContactEmail}
                      </p>
                    )}
                    {account.billingContactPhone && (
                      <p className="text-sm text-muted-foreground">
                        {account.billingContactPhone}
                      </p>
                    )}
                  </div>
                )}
                {account.billingAddressLine1 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Billing Address
                    </p>
                    <p className="text-sm">{account.billingAddressLine1}</p>
                    {account.billingAddressLine2 && (
                      <p className="text-sm">{account.billingAddressLine2}</p>
                    )}
                    <p className="text-sm">
                      {[
                        account.billingCity,
                        account.billingState,
                        account.billingPostalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {account.billingCountry && (
                      <p className="text-sm">{account.billingCountry}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hierarchy">
          <Card>
            <CardHeader>
              <CardTitle>Account Hierarchy</CardTitle>
              <CardDescription>
                Parent and child account relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {account.parentAccountId ? (
                <div className="mb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Parent Account
                  </p>
                  <Link
                    to={`/accounts/${account.parentAccountId}`}
                    className="text-sm hover:underline"
                  >
                    View Parent Account
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  This is a root account (no parent)
                </p>
              )}

              {account.children && account.children.length > 0 ? (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Child Accounts ({account.children.length})
                  </p>
                  <div className="space-y-2">
                    {account.children.map((child: any) => (
                      <Link
                        key={child.id}
                        to={`/accounts/${child.id}`}
                        className="block p-3 border rounded-lg hover:bg-accent"
                      >
                        <p className="text-sm font-medium">
                          {child.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {child.accountType}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No child accounts
                </p>
              )}

              <Link to={`/accounts/${accountId}/hierarchy`}>
                <Button variant="outline" className="mt-4">
                  <Building className="mr-2 h-4 w-4" />
                  View Full Hierarchy
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
              <CardDescription>Active and historical contracts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Contract list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>All invoices for this account</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Invoice list will be displayed here
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
