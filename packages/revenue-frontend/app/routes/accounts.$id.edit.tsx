/**
 * Edit Account Route
 * Form for editing an existing account
 */

import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { AppShell } from "~/components/layout/app-shell";
import { PageHeader } from "~/components/layout/page-header";
import { Card, CardContent } from "~/components/ui/card";
import { PageLoader } from "~/components/page-loader";
import { AccountForm } from "~/components/accounts/account-form";
import { useAccount, useUpdateAccount } from "~/lib/api/hooks/use-accounts";
import type { UpdateAccountDto, Account } from "~/types/models";

export default function EditAccountRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const accountId = params.id!;

  const { data, isLoading } = useAccount(accountId);
  const updateMutation = useUpdateAccount(accountId);

  const account = data?.data as Account | undefined;

  const handleSubmit = async (data: UpdateAccountDto) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success("Account updated successfully");
      navigate(`/accounts/${accountId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update account");
    }
  };

  const handleCancel = () => {
    navigate(`/accounts/${accountId}`);
  };

  if (isLoading) {
    return (
      <AppShell>
        <PageLoader message="Loading account..." />
      </AppShell>
    );
  }

  if (!account) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold">Account not found</h2>
          <p className="text-muted-foreground mt-2">
            The account you're trying to edit doesn't exist.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Edit Account"
        description={`Editing ${account.accountName}`}
      />

      <Card className="mt-6">
        <CardContent className="pt-6">
          <AccountForm
            mode="edit"
            account={account}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
