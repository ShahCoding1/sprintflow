"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

import CreateSprintTaskDialog from "./CreateSprintTaskDialog";
import type { BoardTask } from "@/components/tasks/TaskCard";

type SprintTaskListProps = {
  projectId: string;
  sprintId: string;
};

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED";

type TaskType =
  | "EPIC"
  | "STORY"
  | "TASK"
  | "BUG"
  | "SUBTASK";

type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

type SprintTask = BoardTask & {
  sprintId: string | null;
};

type TaskResponse = {
  success: boolean;
  tasks?: SprintTask[];
  message?: string;
};

const statusConfig: Record<
  TaskStatus,
  {
    label: string;
    icon: typeof Circle;
    className: string;
  }
> = {
  TODO: {
    label: "To Do",
    icon: Circle,
    className:
      "bg-muted text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock3,
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  IN_REVIEW: {
    label: "In Review",
    icon: Clock3,
    className:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  BLOCKED: {
    label: "Blocked",
    icon: AlertCircle,
    className:
      "bg-red-500/10 text-red-700 dark:text-red-300",
  },
};

const priorityLabels: Record<
  TaskPriority,
  string
> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const typeLabels: Record<TaskType, string> = {
  EPIC: "Epic",
  STORY: "Story",
  TASK: "Task",
  BUG: "Bug",
  SUBTASK: "Subtask",
};

function formatDueDate(
  date: string | null,
) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(new Date(date));
}

async function fetchSprintTasks(
  projectId: string,
  sprintId: string,
): Promise<SprintTask[]> {
  const response = await fetch(
    `/api/projects/${projectId}/tasks`,
    {
      cache: "no-store",
    },
  );

  const result =
    (await response.json()) as TaskResponse;

  if (
    !response.ok ||
    !result.success
  ) {
    throw new Error(
      result.message ??
        "Unable to load sprint tasks.",
    );
  }

  return (result.tasks ?? []).filter(
    (task) =>
      task.sprintId === sprintId,
  );
}

export default function SprintTaskList({
  projectId,
  sprintId,
}: SprintTaskListProps) {
  const [tasks, setTasks] =
    useState<SprintTask[] | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);

      const sprintTasks =
        await fetchSprintTasks(
          projectId,
          sprintId,
        );

      setTasks(sprintTasks);
    } catch (error) {
      console.error(
        "Load sprint tasks error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load sprint tasks.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(
    task: BoardTask,
  ) {
    const sprintTask: SprintTask = {
      ...task,
      sprintId,
    };

    setTasks((current) => {
      if (!current) {
        return [sprintTask];
      }

      return [
        sprintTask,
        ...current,
      ];
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border bg-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading sprint tasks...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </div>

        <button
          type="button"
          onClick={() => {
            void loadTasks();
          }}
          className="mt-3 inline-flex items-center gap-2 text-xs font-medium underline underline-offset-4"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </button>
      </div>
    );
  }

  if (tasks === null) {
    return (
      <section className="rounded-2xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Sprint Tasks
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage work directly inside this
              sprint.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CreateSprintTaskDialog
              projectId={projectId}
              sprintId={sprintId}
              onCreated={handleCreated}
            />

            <button
              type="button"
              onClick={() => {
                void loadTasks();
              }}
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
            >
              <RefreshCw className="size-4" />
              Load tasks
            </button>
          </div>
        </div>

        <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Circle className="size-5 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm font-semibold">
            Load sprint tasks
          </p>

          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            Load the current tasks or create a
            new task directly in this sprint.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Sprint Tasks
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {tasks.length}{" "}
            {tasks.length === 1
              ? "task"
              : "tasks"}{" "}
            assigned to this sprint.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CreateSprintTaskDialog
            projectId={projectId}
            sprintId={sprintId}
            onCreated={handleCreated}
          />

          <button
            type="button"
            onClick={() => {
              void loadTasks();
            }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            Refresh
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-muted">
            <Circle className="size-5 text-muted-foreground" />
          </div>

          <h3 className="mt-4 text-sm font-semibold">
            No tasks in this sprint
          </h3>

          <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
            Create the first task for this
            sprint.
          </p>

          <div className="mt-4">
            <CreateSprintTaskDialog
              projectId={projectId}
              sprintId={sprintId}
              onCreated={handleCreated}
            />
          </div>
        </div>
      ) : (
        <div className="divide-y">
          {tasks.map((task) => {
            const config =
              statusConfig[task.status];

            const StatusIcon =
              config.icon;

            const dueDate =
              formatDueDate(
                task.dueDate,
              );

            return (
              <div
                key={task.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/projects/${projectId}`}
                    className="block truncate text-sm font-semibold hover:text-primary"
                  >
                    {task.title}
                  </Link>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium">
                      {typeLabels[task.type]}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${config.className}`}
                    >
                      <StatusIcon className="size-3" />
                      {config.label}
                    </span>

                    <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                      {priorityLabels[
                        task.priority
                      ]}
                    </span>

                    {task.storyPoints !==
                      null && (
                      <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {task.storyPoints} pts
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  {task.assignee && (
                    <span className="max-w-[180px] truncate">
                      {task.assignee.name ??
                        task.assignee.email}
                    </span>
                  )}

                  {dueDate && (
                    <span>
                      Due {dueDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}