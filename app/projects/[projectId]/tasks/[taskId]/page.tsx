import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ListTree,
  MessageSquare,
  History,
  User,
} from "lucide-react";

import { auth } from "@/auth";

import DeleteTaskButton from "@/components/tasks/DeleteTaskButton";
import SubtaskList from "@/components/tasks/SubtaskList";
import TaskActivity from "@/components/tasks/TaskActivity";
import TaskComments from "@/components/tasks/TaskComments";
import TaskLabels from "@/components/tasks/TaskLabels";

import { taskService } from "@/server/services/task.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type TaskPageProps = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

function formatDate(
  value: string | Date | null | undefined,
) {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

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

  const assignee =
    "assignee" in task &&
    task.assignee &&
    typeof task.assignee === "object"
      ? task.assignee
      : null;

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back to Project
          </Link>
        </div>

        <header className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium">
                    {task.type}
                  </span>

                  <span>•</span>

                  <span>
                    {task.status.replace(
                      "_",
                      " ",
                    )}
                  </span>

                  <span>•</span>

                  <span>
                    {task.priority}
                  </span>
                </div>

                <h1 className="mt-4 break-words text-2xl font-bold tracking-tight sm:text-3xl">
                  {task.title}
                </h1>

                {task.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground sm:text-base">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <DeleteTaskButton
                  projectId={projectId}
                  taskId={task.id}
                  taskTitle={task.title}
                />
              </div>
            </div>

            <TaskLabels
              projectId={projectId}
              taskId={task.id}
            />
          </div>
        </header>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <CircleDot className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Task Details
            </h2>
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <User className="size-3.5" />
                Assignee
              </div>

              <p className="mt-1 text-sm">
                {assignee &&
                typeof assignee === "object" &&
                "name" in assignee &&
                typeof assignee.name === "string"
                  ? assignee.name
                  : assignee &&
                      typeof assignee ===
                        "object" &&
                      "email" in assignee &&
                      typeof assignee.email ===
                        "string"
                    ? assignee.email
                    : "Unassigned"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CheckCircle2 className="size-3.5" />
                Story Points
              </div>

              <p className="mt-1 text-sm">
                {task.storyPoints ??
                  "Not estimated"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="size-3.5" />
                Due Date
              </div>

              <p className="mt-1 text-sm">
                {formatDate(task.dueDate)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ListTree className="size-3.5" />
                Position
              </div>

              <p className="mt-1 text-sm">
                {task.position + 1}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <ListTree className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Subtasks
            </h2>
          </div>

          <SubtaskList
            projectId={projectId}
            taskId={task.id}
          />
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <History className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Activity History
            </h2>
          </div>

          <TaskActivity
            projectId={projectId}
            taskId={task.id}
          />
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Comments
            </h2>
          </div>

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