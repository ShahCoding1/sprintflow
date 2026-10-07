import { notFound } from "next/navigation";

import { auth } from "@/auth";
import WorkspaceSettings from "@/components/settings/workspace/WorkspaceSettings";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export default async function WorkspaceSettingsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const workspace =
    await workspaceContextService.getWorkspaceContext();

  if (!workspace) {
    notFound();
  }

  return <WorkspaceSettings />;
}