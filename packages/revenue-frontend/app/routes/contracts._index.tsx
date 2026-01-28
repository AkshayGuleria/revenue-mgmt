/**
 * Contracts List Route
 * Displays all contracts with filters and pagination
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
import { useContracts } from "~/lib/api/hooks/use-contracts";
import type { Contract } from "~/types/models";
import { PAGINATION } from "~/lib/constants";

export default function ContractsListRoute() {
  const [offset, setOffset] = useState(PAGINATION.DEFAULT_OFFSET);
  const [limit] = useState(PAGINATION.DEFAULT_LIMIT);

  const { data, isLoading } = useContracts({
    "offset[eq]": offset,
    "limit[eq]": limit,
  });

  const columns: Column<Contract>[] = [
    {
      key: "contractNumber",
      header: "Contract Number",
      cell: (contract) => (
        <Link
          to={`/contracts/${contract.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {contract.contractNumber}
        </Link>
      ),
    },
    {
      key: "account",
      header: "Account",
      cell: (contract) => (
        <Link
          to={`/accounts/${contract.accountId}`}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          {contract.account?.accountName || contract.accountId}
        </Link>
      ),
    },
    {
      key: "contractValue",
      header: "Value",
      cell: (contract) => <CurrencyDisplay amount={contract.contractValue} />,
    },
    {
      key: "billingFrequency",
      header: "Billing Frequency",
      cell: (contract) => (
        <span className="capitalize text-sm">
          {contract.billingFrequency.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "startDate",
      header: "Start Date",
      cell: (contract) => <DateDisplay date={contract.startDate} />,
    },
    {
      key: "endDate",
      header: "End Date",
      cell: (contract) => <DateDisplay date={contract.endDate} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (contract) => {
        const colorMap: Record<string, "green" | "gray" | "yellow" | "red" | "blue"> = {
          draft: "gray",
          active: "green",
          expired: "yellow",
          cancelled: "red",
          renewed: "blue",
        };
        return (
          <StatusBadge
            status={contract.status}
            color={colorMap[contract.status]}
          />
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (contract) => (
        <Link to={`/contracts/${contract.id}/edit`}>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Link>
      ),
    },
  ];

  const contracts = Array.isArray(data?.data) ? data.data : [];

  return (
    <AppShell>
      <PageHeader
        title="Contracts"
        description="Manage multi-year contracts and seat-based licensing"
        actions={
          <Link to="/contracts/new">
            <Button className="hover:scale-105 active:scale-95 transition-transform duration-200">
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </Link>
        }
      />

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={contracts}
          paging={data?.paging}
          isLoading={isLoading}
          onPageChange={setOffset}
          emptyState={
            <EmptyState
              title="No contracts found"
              description="Get started by creating your first contract"
              action={{
                label: "Create Contract",
                onClick: () => (window.location.href = "/contracts/new"),
              }}
            />
          }
        />
      </div>
    </AppShell>
  );
}
