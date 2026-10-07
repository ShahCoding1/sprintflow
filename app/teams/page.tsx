import { notFound } from "next/navigation";

import { auth } from "@/auth";
import TeamManagement from "@/components/teams/TeamManagement";
import { AppShell } from "@/components/layout/AppShell";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export default async function TeamsPage() {
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
      <TeamManagement />
    </AppShell>
  );
}