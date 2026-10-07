import { notFound } from "next/navigation";

import { auth } from "@/auth";
import TaskComments from "@/components/tasks/TaskComments";
import TaskLabels from "@/components/tasks/TaskLabels";
import TaskTimeTracker from "@/components/time-tracking/TaskTimeTracker";
import { taskService } from "@/server/services/task.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type TaskPageProps = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export default async function TaskPage({
  params,
}: TaskPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { projectId, taskId } = await params;

  const workspace =
    await workspaceContextService.getWorkspaceContext();

  if (!workspace) {
    notFound();
  }

  const tasks = await taskService.getTasks({
    projectId,
    organizationId: workspace.id,
  });

  const task = tasks.find(
    (item) => item.id === taskId,
  );

  if (!task) {
    notFound();
  }

  const taskLabels =
    "labels" in task && Array.isArray(task.labels)
      ? task.labels
          .map((assignment) => {
            if (
              assignment &&
              typeof assignment === "object" &&
              "label" in assignment &&
              assignment.label &&
              typeof assignment.label === "object"
            ) {
              const label = assignment.label as {
                id: string;
                name: string;
                color: string;
              };

              return {
                id: label.id,
                name: label.name,
                color: label.color,
              };
            }

            return null;
          })
          .filter(
            (
              label,
            ): label is {
              id: string;
              name: string;
              color: string;
            } => label !== null,
          )
      : [];

  const assignee =
    "assignee" in task &&
    task.assignee &&
    typeof task.assignee === "object"
      ? task.assignee
      : null;

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{task.type}</span>
              <span>•</span>
              <span>{task.status}</span>
              <span>•</span>
              <span>{task.priority}</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {task.title}
              </h1>

              {task.description && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground sm:text-base">
                  {task.description}
                </p>
              )}
            </div>

            <TaskLabels
              projectId={projectId}
              taskId={task.id}
              initialLabels={taskLabels}
            />
          </div>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">
            Task Details
          </h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Assignee
              </p>

              <p className="mt-1 text-sm">
                {assignee &&
                typeof assignee === "object" &&
                "name" in assignee &&
                typeof assignee.name === "string"
                  ? assignee.name
                  : assignee &&
                      typeof assignee === "object" &&
                      "email" in assignee &&
                      typeof assignee.email === "string"
                    ? assignee.email
                    : "Unassigned"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Story Points
              </p>

              <p className="mt-1 text-sm">
                {task.storyPoints ??
                  "Not estimated"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Due Date
              </p>

              <p className="mt-1 text-sm">
                {task.dueDate
                  ? new Date(
                      task.dueDate,
                    ).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "No due date"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Position
              </p>

              <p className="mt-1 text-sm">
                {task.position + 1}
              </p>
            </div>
          </div>
        </section>

        <TaskTimeTracker
          projectId={projectId}
          taskId={task.id}
          currentUserId={session.user.id}
        />

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <TaskComments
            projectId={projectId}
            taskId={task.id}
            currentUserId={session.user.id}
          />
        </section>
      </div>
    </main>
  );
}