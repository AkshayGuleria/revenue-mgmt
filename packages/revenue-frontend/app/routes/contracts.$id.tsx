/**
 * Contract Details Route
 * Enhanced UX inline with account details view
 */

import { useParams, Link } from "react-router";
import {
  Edit,
  FileText,
  Building,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  RefreshCw,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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
        description={`${contract.billingFrequency.replace(/_/g, " ")} contract • ${contract.account?.accountName || contract.accountId}`}
        actions={
          <Link to={`/contracts/${contractId}/edit`}>
            <Button className="hover:scale-105 active:scale-95 transition-transform duration-200">
              <Edit className="mr-2 h-4 w-4" />
              Edit Contract
            </Button>
          </Link>
        }
      />

      <div className="flex items-center gap-3 mt-6 mb-8">
        <StatusBadge status={contract.status} color={colorMap[contract.status]} />
        <span className="text-gray-400">•</span>
        <span className="text-sm text-gray-600 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <DateDisplay date={contract.startDate} /> - <DateDisplay date={contract.endDate} />
        </span>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            Billing
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
            Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
              <CardHeader className="bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">Contract Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-6 p-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Building className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Account</p>
                    <Link
                      to={`/accounts/${contract.accountId}`}
                      className="text-base font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {contract.account?.accountName || contract.accountId}
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Contract Value</p>
                    <p className="text-lg font-bold text-gray-900">
                      <CurrencyDisplay amount={contract.contractValue} />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Start Date</p>
                    <p className="text-base font-medium text-gray-900">
                      <DateDisplay date={contract.startDate} />
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">End Date</p>
                    <p className="text-base font-medium text-gray-900">
                      <DateDisplay date={contract.endDate} />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat-Based Pricing Card */}
            {(contract.seatCount || contract.committedSeats || contract.seatPrice) && (
              <Card className="overflow-hidden border-0 shadow-lg">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600" />
                <CardHeader className="bg-gradient-to-br from-emerald-50 to-teal-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">Seat Licensing</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {contract.seatCount && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Current Seats</p>
                        <p className="text-lg font-bold text-gray-900">{contract.seatCount} users</p>
                      </div>
                    </div>
                  )}
                  {contract.committedSeats && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <CheckCircle className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Committed Seats</p>
                        <p className="text-lg font-bold text-gray-900">{contract.committedSeats} users</p>
                      </div>
                    </div>
                  )}
                  {contract.seatPrice && (
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Price Per Seat</p>
                        <p className="text-lg font-bold text-gray-900">
                          <CurrencyDisplay amount={contract.seatPrice} />
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Renewal Configuration Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
              <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">Renewal Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
                    {contract.autoRenew ? (
                      <CheckCircle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Auto-Renewal</p>
                    <p className="text-base font-medium text-gray-900">
                      {contract.autoRenew ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Notice Period</p>
                    <p className="text-base font-medium text-gray-900">{contract.renewalNoticeDays} days before expiration</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          {contract.notes && (
            <Card className="mt-6 overflow-hidden border-0 shadow-lg">
              <div className="h-2 bg-gradient-to-r from-gray-400 to-gray-600" />
              <CardHeader className="bg-gradient-to-br from-gray-50 to-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-500 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">Contract Notes</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-base text-gray-700 whitespace-pre-wrap leading-relaxed">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-600" />
            <CardHeader className="bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Billing Configuration</CardTitle>
                  <CardDescription className="text-gray-600">Payment and billing settings for this contract</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Billing Frequency</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {contract.billingFrequency.replace(/_/g, " ")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Payment Terms</p>
                  <p className="text-base font-medium text-gray-900">
                    {contract.paymentTerms.replace(/_/g, " ").toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <TrendingUp className="h-4 w-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Billing Timing</p>
                  <p className="text-base font-medium text-gray-900">
                    {contract.billingInAdvance ? "In Advance" : "In Arrears"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-600" />
            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">Contract Invoices</CardTitle>
                  <CardDescription className="text-gray-600">
                    {contract._count?.invoices || 0} invoice(s) generated from this contract
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 flex items-center justify-center">
                  <Receipt className="h-10 w-10 text-purple-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">No Invoices Yet</p>
                <p className="text-sm text-gray-600 mb-6">
                  Invoices will appear here once generated from this contract
                </p>
                <Link to="/billing/generate">
                  <Button className="hover:scale-105 active:scale-95 transition-transform duration-200">
                    Generate Invoice
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
