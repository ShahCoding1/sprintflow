"use client";

import Image from "next/image";
import {
  Bug,
  CheckCircle2,
  Circle,
  Clock3,
  MoreHorizontal,
  Zap,
} from "lucide-react";

import EditTaskDialog from "./EditTaskDialog";

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

export type BoardTask = {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number | null;
  dueDate: string | null;
  position: number;
  sprintId?: string | null;
  parentId?: string | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

type TaskCardProps = {
  projectId: string;
  task: BoardTask;
  onUpdated: (task: BoardTask) => void;
};

const priorityConfig: Record<
  TaskPriority,
  {
    label: string;
    className: string;
  }
> = {
  LOW: {
    label: "Low",
    className: "bg-muted text-muted-foreground",
  },
  MEDIUM: {
    label: "Medium",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  HIGH: {
    label: "High",
    className:
      "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  },
  URGENT: {
    label: "Urgent",
    className:
      "bg-red-500/10 text-red-700 dark:text-red-300",
  },
};

const typeIcons = {
  EPIC: Zap,
  STORY: Circle,
  TASK: CheckCircle2,
  BUG: Bug,
  SUBTASK: Circle,
};

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default function TaskCard({
  projectId,
  task,
  onUpdated,
}: TaskCardProps) {
  const TypeIcon = typeIcons[task.type];
  const priority = priorityConfig[task.priority];

  const assigneeInitial = (
    task.assignee?.name ??
    task.assignee?.email ??
    "U"
  )
    .charAt(0)
    .toUpperCase();

  return (
    <article className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <TypeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <h3 className="line-clamp-2 text-sm font-semibold leading-5">
            {task.title}
          </h3>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <EditTaskDialog
            projectId={projectId}
            task={task}
            onUpdated={onUpdated}
          />

          <button
            type="button"
            aria-label={`More options for ${task.title}`}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-md px-2 py-1 text-[11px] font-medium ${priority.className}`}
        >
          {priority.label}
        </span>

        {task.storyPoints !== null && (
          <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {task.storyPoints} pts
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {task.assignee.image ? (
                <Image
                  src={task.assignee.image}
                  alt={task.assignee.name ?? "Assignee"}
                  width={28}
                  height={28}
                  className="size-full object-cover"
                  unoptimized
                />
              ) : (
                assigneeInitial
              )}
            </div>

            <span className="truncate text-xs text-muted-foreground">
              {task.assignee.name ?? task.assignee.email}
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">
            Unassigned
          </span>
        )}

        {task.dueDate && (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
    </article>
  );
}