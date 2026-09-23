import { AppShell } from "@/components/layout/AppShell";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export default async function DashboardPage() {
  const workspace = await workspaceContextService.getWorkspaceContext();

  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">Overview</p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back. Here is what&apos;s happening across your workspace.
          </p>
        </div>

        {workspace ? (
          <div className="mb-6 rounded-xl border bg-card p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  Current workspace
                </p>

                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {workspace.name}
                </h2>

                {workspace.description && (
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    {workspace.description}
                  </p>
                )}
              </div>

              <div className="inline-flex w-fit items-center rounded-full border bg-muted px-3 py-1.5 text-xs font-medium">
                {workspace.role}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed bg-card p-6">
            <h2 className="text-lg font-semibold">
              No workspace configured
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Create a workspace to start managing projects, sprints, tasks,
              and your team.
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Projects</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Active Tasks</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Active Sprints</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Team Members</p>
            <p className="mt-2 text-3xl font-semibold">0</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Workspace activity</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Projects, sprints, tasks, and team activity will appear here as
            your workspace grows.
          </p>
        </div>
      </div>
    </AppShell>
  );
}