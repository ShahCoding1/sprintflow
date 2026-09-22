import { AppShell } from "@/components/layout/AppShell";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-6">
        <div className="mb-8">
          <p className="text-sm text-muted-foreground">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Welcome back. Here is what&apos;s happening across your workspace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Projects
            </p>

            <p className="mt-2 text-3xl font-semibold">
              0
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Active Tasks
            </p>

            <p className="mt-2 text-3xl font-semibold">
              0
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Active Sprints
            </p>

            <p className="mt-2 text-3xl font-semibold">
              0
            </p>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">
              Team Members
            </p>

            <p className="mt-2 text-3xl font-semibold">
              0
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">
            Your workspace
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Your projects, sprints, tasks, and team activity will appear
            here once your workspace is configured.
          </p>
        </div>
      </div>
    </AppShell>
  );
}