import { notFound } from "next/navigation";

import SprintCard, {
  type Sprint,
} from "@/components/sprints/SprintCard";
import SprintSummary from "@/components/sprints/SprintSummary";
import SprintTaskList from "@/components/sprints/SprintTaskList";
import { sprintService } from "@/server/services/sprint.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type SprintPageProps = {
  params: Promise<{
    projectId: string;
    sprintId: string;
  }>;
};

export default async function SprintPage({
  params,
}: SprintPageProps) {
  const {
    projectId,
    sprintId,
  } = await params;

  const workspace =
    await workspaceContextService.getWorkspaceContext();

  if (!workspace) {
    notFound();
  }

  const sprints =
    await sprintService.getSprints({
      projectId,
      organizationId: workspace.id,
    });

  const sprint = sprints.find(
    (item) => item.id === sprintId,
  );

  if (!sprint) {
    notFound();
  }

  const initialSprint: Sprint = {
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    startDate:
      sprint.startDate?.toISOString() ??
      null,
    endDate:
      sprint.endDate?.toISOString() ??
      null,
    createdAt:
      sprint.createdAt.toISOString(),
    updatedAt:
      sprint.updatedAt.toISOString(),
    _count: {
      tasks: sprint._count.tasks,
    },
  };

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sprint
              </span>

              <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                {sprint.status}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {sprint.name}
            </h1>

            {sprint.goal && (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {sprint.goal}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span>
                Tasks:{" "}
                <strong className="font-medium text-foreground">
                  {sprint._count.tasks}
                </strong>
              </span>

              {sprint.startDate && (
                <span>
                  Started:{" "}
                  <strong className="font-medium text-foreground">
                    {new Intl.DateTimeFormat(
                      "en-US",
                      {
                        dateStyle: "medium",
                      },
                    ).format(
                      sprint.startDate,
                    )}
                  </strong>
                </span>
              )}

              {sprint.endDate && (
                <span>
                  Ended:{" "}
                  <strong className="font-medium text-foreground">
                    {new Intl.DateTimeFormat(
                      "en-US",
                      {
                        dateStyle: "medium",
                      },
                    ).format(
                      sprint.endDate,
                    )}
                  </strong>
                </span>
              )}
            </div>
          </div>
        </header>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Sprint Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Track progress and delivery metrics
              for this sprint.
            </p>
          </div>

          <SprintSummary
            projectId={projectId}
            sprintId={sprint.id}
          />
        </section>

        <SprintTaskList
          projectId={projectId}
          sprintId={sprint.id}
        />

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-semibold">
              Sprint Management
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage sprint status and configuration.
            </p>
          </div>

          <div className="mt-4">
            <SprintCard
              projectId={projectId}
              sprint={initialSprint}
              onUpdated={() => {}}
              onDelete={() => {}}
            />
          </div>
        </section>
      </div>
    </main>
  );
}