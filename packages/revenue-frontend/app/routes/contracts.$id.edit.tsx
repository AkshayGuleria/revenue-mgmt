/**
 * Edit Contract Route
 */

import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { PageLoader } from "~/components/page-loader";
import { ContractForm } from "~/components/contracts/contract-form";
import { useContract, useUpdateContract } from "~/lib/api/hooks/use-contracts";
import type { UpdateContractDto, Contract } from "~/types/models";

export default function EditContractRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const contractId = params.id!;

  const { data, isLoading } = useContract(contractId);
  const updateMutation = useUpdateContract(contractId);

  const contract = data?.data as Contract | undefined;

  const handleSubmit = async (data: UpdateContractDto) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Contract updated successfully");
      navigate(`/contracts/${contractId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update contract");
    }
  };

  const handleCancel = () => {
    navigate(`/contracts/${contractId}`);
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader message="Loading contract..." />
      </AppShell>
    );
  }

  if (!contract) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Contract not found</h2>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Edit Contract"
        description={`Editing ${contract.contractNumber}`}
      />

      <Card className="mt-6">
        <CardContent className="pt-6">
          <ContractForm
            mode="edit"
            contract={contract}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
