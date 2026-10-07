"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bug,
  CheckCircle2,
  Circle,
  Clock3,
  GripVertical,
  MoreHorizontal,
  Zap,
} from "lucide-react";

import type {
  DraggableAttributes,
} from "@dnd-kit/core";

import type {
  SyntheticListenerMap,
} from "@dnd-kit/core/dist/hooks/utilities";

import type {
  TaskLabelAssignmentSummary,
} from "@/features/task/types/task-label.types";

import EditTaskDialog from "./EditTaskDialog";
import TaskLabelBadges from "./TaskLabelBadges";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED";

export type TaskType =
  | "EPIC"
  | "STORY"
  | "TASK"
  | "BUG"
  | "SUBTASK";

export type TaskPriority =
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

  labels?: TaskLabelAssignmentSummary[];
};

type TaskCardProps = {
  projectId: string;
  task: BoardTask;
  onUpdated: (task: BoardTask) => void;
  dragHandleProps?: {
    attributes: DraggableAttributes;
    listeners: SyntheticListenerMap | undefined;
  };
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
    className:
      "bg-muted text-muted-foreground",
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
  dragHandleProps,
}: TaskCardProps) {
  const TypeIcon = typeIcons[task.type];
  const priority =
    priorityConfig[task.priority];

  const assigneeInitial = (
    task.assignee?.name ??
    task.assignee?.email ??
    "U"
  )
    .charAt(0)
    .toUpperCase();

  const labelSummaries =
    task.labels?.map(
      (assignment) => assignment.label,
    ) ?? [];

  return (
    <article className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {dragHandleProps && (
            <button
              type="button"
              aria-label={`Drag ${task.title}`}
              className="mt-0.5 shrink-0 cursor-grab rounded-md p-1 text-muted-foreground opacity-60 transition hover:bg-muted hover:opacity-100 active:cursor-grabbing"
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}

          <TypeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

          <Link
            href={`/projects/${projectId}/tasks/${task.id}`}
            className="min-w-0 flex-1"
          >
            <h3 className="line-clamp-2 text-sm font-semibold leading-5 transition hover:text-primary">
              {task.title}
            </h3>
          </Link>
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
        <Link
          href={`/projects/${projectId}/tasks/${task.id}`}
          className="block"
        >
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground transition hover:text-foreground">
            {task.description}
          </p>
        </Link>
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

      {labelSummaries.length > 0 && (
        <div className="mt-3">
          <TaskLabelBadges
            labels={labelSummaries}
          />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t pt-3">
        {task.assignee ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {task.assignee.image ? (
                <Image
                  src={task.assignee.image}
                  alt={
                    task.assignee.name ??
                    "Assignee"
                  }
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
              {task.assignee.name ??
                task.assignee.email}
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