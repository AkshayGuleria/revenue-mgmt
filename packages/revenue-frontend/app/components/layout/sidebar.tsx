/**
 * Sidebar Navigation Component
 * Collapsible sidebar with menu items
 */

import { Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Package,
  Receipt,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { useUIStore } from "~/lib/stores/ui-store";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { APP_NAME } from "~/lib/constants";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Accounts", href: "/accounts", icon: Building2 },
  { name: "Contracts", href: "/contracts", icon: FileText },
  { name: "Products", href: "/products", icon: Package },
  { name: "Invoices", href: "/invoices", icon: Receipt },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-white shadow-lg transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
        {!sidebarCollapsed && (
          <h1 className="text-lg font-bold truncate text-white">{APP_NAME}</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapsed}
          className={cn("text-white hover:bg-white/20", sidebarCollapsed && "mx-auto")}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== "/" && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md scale-105"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 active:scale-95",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t p-4 bg-gray-50">
          <p className="text-xs text-gray-500 font-medium">
            Revenue Management v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
