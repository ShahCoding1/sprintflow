import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import InvitationManagement from "@/components/invitations/InvitationManagement";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export default async function WorkspaceMembersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const workspace =
    await workspaceContextService.getWorkspaceContext();

  if (!workspace) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Workspace administration
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Members & invitations
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage workspace access and invite new
            members with controlled workspace roles.
          </p>
        </div>

        <InvitationManagement />
      </div>
    </AppShell>
  );
}