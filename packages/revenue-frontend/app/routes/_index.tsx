/**
 * Dashboard Route
 * Main dashboard page with key metrics
 */

import { Link } from "react-router";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Building2, FileText, Receipt, DollarSign, TrendingUp, TrendingDown, Plus, Zap, FileSpreadsheet } from "lucide-react";

export default function Dashboard() {
  // Mock data - will be replaced with real API calls
  const stats = [
    {
      title: "Total Accounts",
      value: "142",
      description: "vs 130 last month",
      trend: "+9.2%",
      trendUp: true,
      icon: Building2,
    },
    {
      title: "Active Contracts",
      value: "89",
      description: "vs 84 last month",
      trend: "+6.0%",
      trendUp: true,
      icon: FileText,
    },
    {
      title: "Pending Invoices",
      value: "23",
      description: "$145,230 total value",
      trend: "-12.5%",
      trendUp: false,
      icon: Receipt,
    },
    {
      title: "Monthly Revenue",
      value: "$425,230",
      description: "vs $360,195 last month",
      trend: "+18.1%",
      trendUp: true,
      icon: DollarSign,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Overview of your revenue management system"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {stats.map((stat, index) => {
          const gradients = [
            "from-blue-500 to-blue-600",
            "from-green-500 to-green-600",
            "from-amber-500 to-amber-600",
            "from-purple-500 to-purple-600",
          ];
          const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
          const trendColor = stat.trendUp ? "text-green-600" : "text-red-600";

          return (
            <Card key={stat.title} className="overflow-hidden border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`h-2 bg-gradient-to-r ${gradients[index]}`} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${gradients[index]} bg-opacity-10`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gray-900 tracking-tight mb-2">{stat.value}</div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
                    <TrendIcon className="h-4 w-4" />
                    {stat.trend}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mt-8 shadow-lg border-0">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            <CardTitle className="text-2xl font-bold text-gray-900">Quick Actions</CardTitle>
          </div>
          <CardDescription className="text-base text-gray-600">
            Common tasks to get you started quickly
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/accounts/new">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 active:scale-95 transition-all duration-200">
                <Building2 className="h-8 w-8 text-blue-600" />
                <span className="font-semibold text-gray-900">New Account</span>
              </Button>
            </Link>
            <Link to="/contracts/new">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-300 hover:scale-105 active:scale-95 transition-all duration-200">
                <FileText className="h-8 w-8 text-green-600" />
                <span className="font-semibold text-gray-900">New Contract</span>
              </Button>
            </Link>
            <Link to="/invoices/new">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-amber-50 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all duration-200">
                <Receipt className="h-8 w-8 text-amber-600" />
                <span className="font-semibold text-gray-900">New Invoice</span>
              </Button>
            </Link>
            <Link to="/billing/generate">
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-300 hover:scale-105 active:scale-95 transition-all duration-200">
                <FileSpreadsheet className="h-8 w-8 text-purple-600" />
                <span className="font-semibold text-gray-900">Generate Billing</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4 shadow-lg border-0">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl font-bold text-gray-900">Recent Activity</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Latest updates from your revenue system
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-0 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-green-200 before:via-blue-200 before:to-purple-200">
              <div className="flex items-center p-4 rounded-lg hover:bg-blue-50 hover:translate-x-1 transition-all duration-200 cursor-pointer relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md relative z-10 ring-4 ring-white">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-base font-bold text-gray-900 leading-none">
                    New invoice generated
                  </p>
                  <p className="text-sm text-gray-600">
                    Invoice #INV-2024-001 for Acme Corp - $12,500
                  </p>
                </div>
                <div className="ml-auto text-xs text-gray-400 font-semibold">
                  2h ago
                </div>
              </div>
              <div className="flex items-center p-4 rounded-lg hover:bg-blue-50 hover:translate-x-1 transition-all duration-200 cursor-pointer relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md relative z-10 ring-4 ring-white">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-base font-bold text-gray-900 leading-none">
                    Contract renewed
                  </p>
                  <p className="text-sm text-gray-600">
                    Enterprise Plan for TechStart Inc - 1 year extension
                  </p>
                </div>
                <div className="ml-auto text-xs text-gray-400 font-semibold">
                  5h ago
                </div>
              </div>
              <div className="flex items-center p-4 rounded-lg hover:bg-blue-50 hover:translate-x-1 transition-all duration-200 cursor-pointer relative">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md relative z-10 ring-4 ring-white">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4 space-y-1 flex-1">
                  <p className="text-base font-bold text-gray-900 leading-none">
                    New account created
                  </p>
                  <p className="text-sm text-gray-600">
                    GlobalTech Solutions - Enterprise tier
                  </p>
                </div>
                <div className="ml-auto text-xs text-gray-400 font-semibold">
                  1d ago
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-lg border-0">
          <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle className="text-2xl font-bold text-gray-900">Contract Expiration Alerts</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Contracts expiring in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="space-y-1">
                  <p className="text-base font-bold leading-none text-red-900">
                    Acme Corporation
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    Expires in 15 days
                  </p>
                </div>
                <span className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white rounded-full shadow-sm">
                  URGENT
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="space-y-1">
                  <p className="text-base font-bold leading-none text-amber-900">
                    TechVision LLC
                  </p>
                  <p className="text-sm text-amber-600 font-medium">
                    Expires in 22 days
                  </p>
                </div>
                <span className="px-3 py-1.5 text-xs font-bold bg-amber-500 text-white rounded-full shadow-sm">
                  SOON
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="space-y-1">
                  <p className="text-base font-bold leading-none text-yellow-900">
                    DataFlow Systems
                  </p>
                  <p className="text-sm text-yellow-600 font-medium">
                    Expires in 28 days
                  </p>
                </div>
                <span className="px-3 py-1.5 text-xs font-bold bg-yellow-500 text-white rounded-full shadow-sm">
                  WATCH
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
