/**
 * Billing Dashboard Route
 */

import { Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  FileText,
  Calendar,
  Layers,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  useQueueStats,
  useConsolidatedQueueStats,
} from "~/lib/api/hooks/use-billing";

export default function BillingDashboardRoute() {
  const { data: queueStats } = useQueueStats();
  const { data: consolidatedStats } = useConsolidatedQueueStats();

  const stats = queueStats?.data;
  const consolidatedQueueStats = consolidatedStats?.data;

  return (
    <AppShell>
      <PageHeader
        title="Billing Operations"
        description="Generate invoices and manage billing operations"
      />

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/billing/generate">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Generate Invoice</h3>
                <p className="text-sm text-gray-600">
                  Generate invoice from contract
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/billing/batch">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white group-hover:scale-110 transition-transform">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Batch Billing</h3>
                <p className="text-sm text-gray-600">
                  Generate invoices for multiple contracts
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/billing/consolidated">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white group-hover:scale-110 transition-transform">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  Consolidated Billing
                </h3>
                <p className="text-sm text-gray-600">
                  Generate consolidated invoice for subsidiaries
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Queue Statistics */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contract Billing Queue */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">Contract Billing Queue</h3>
          </div>

          {stats ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Waiting
                  </span>
                </div>
                <span className="text-xl font-bold text-yellow-600">
                  {stats.waiting}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {stats.active}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Completed
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {stats.completed}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Failed
                  </span>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {stats.failed}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Loading statistics...
            </div>
          )}
        </Card>

        {/* Consolidated Billing Queue */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-100">
              <Layers className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Consolidated Billing Queue</h3>
          </div>

          {consolidatedQueueStats ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Waiting
                  </span>
                </div>
                <span className="text-xl font-bold text-yellow-600">
                  {consolidatedQueueStats.waiting}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Active
                  </span>
                </div>
                <span className="text-xl font-bold text-blue-600">
                  {consolidatedQueueStats.active}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Completed
                  </span>
                </div>
                <span className="text-xl font-bold text-green-600">
                  {consolidatedQueueStats.completed}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Failed
                  </span>
                </div>
                <span className="text-xl font-bold text-red-600">
                  {consolidatedQueueStats.failed}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Loading statistics...
            </div>
          )}
        </Card>
      </div>

      {/* Recent Billing Operations */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Billing Operations</h3>
        <div className="text-sm text-gray-500">
          Billing history tracking coming soon
        </div>
      </Card>
    </AppShell>
  );
}
