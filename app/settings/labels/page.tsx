import { notFound } from "next/navigation";

import LabelManagement from "@/components/labels/LabelManagement";
import { labelService } from "@/server/services/label.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export default async function LabelsSettingsPage() {
  const workspace =
    await workspaceContextService.getWorkspaceContext();

  if (!workspace) {
    notFound();
  }

  const labels =
    await labelService.getLabels(workspace.id);

  const initialLabels = labels.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
    createdAt: label.createdAt.toISOString(),
    updatedAt: label.updatedAt.toISOString(),
  }));

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <LabelManagement
          initialLabels={initialLabels}
        />
      </div>
    </main>
  );
}