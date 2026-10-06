"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import EditSprintDialog from "./EditSprintDialog";

export type SprintStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED";

export type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
  };
};

type SprintCardProps = {
  projectId: string;
  sprint: Sprint;
  onUpdated: (sprint: Sprint) => void;
  onDelete: (sprint: Sprint) => void;
};

const statusConfig: Record<
  SprintStatus,
  {
    label: string;
    className: string;
    icon: typeof Clock3;
  }
> = {
  PLANNED: {
    label: "Planned",
    className:
      "bg-muted text-muted-foreground",
    icon: Clock3,
  },
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: Target,
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: CheckCircle2,
  },
};

function formatDate(date: string | null) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function SprintCard({
  projectId,
  sprint,
  onUpdated,
  onDelete,
}: SprintCardProps) {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const config =
    statusConfig[sprint.status];

  const StatusIcon = config.icon;

  const deleteDisabled =
    sprint.status === "ACTIVE" ||
    sprint._count.tasks > 0;

  function handleDelete() {
    setMenuOpen(false);
    onDelete(sprint);
  }

  return (
    <article className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold">
              {sprint.name}
            </h3>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${config.className}`}
            >
              <StatusIcon className="size-3.5" />
              {config.label}
            </span>
          </div>

          {sprint.goal ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {sprint.goal}
            </p>
          ) : (
            <p className="mt-2 text-sm italic text-muted-foreground/70">
              No sprint goal defined.
            </p>
          )}
        </div>

        <div className="relative flex shrink-0 items-center gap-1">
          <EditSprintDialog
            projectId={projectId}
            sprint={sprint}
            onUpdated={onUpdated}
          />

          <button
            type="button"
            aria-label={`Delete ${sprint.name}`}
            onClick={handleDelete}
            disabled={deleteDisabled}
            title={
              sprint.status === "ACTIVE"
                ? "Active sprints cannot be deleted"
                : sprint._count.tasks > 0
                  ? "Sprints containing tasks cannot be deleted"
                  : "Delete sprint"
            }
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>

          <button
            type="button"
            aria-label={`More options for ${sprint.name}`}
            aria-expanded={menuOpen}
            onClick={() =>
              setMenuOpen(
                (current) => !current,
              )
            }
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border bg-popover p-1.5 shadow-lg">
              <button
                type="button"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
              >
                Close menu
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteDisabled}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="mr-2 size-4" />
                Delete sprint
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Start
            </p>

            <p className="truncate text-xs font-medium">
              {formatDate(sprint.startDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              End
            </p>

            <p className="truncate text-xs font-medium">
              {formatDate(sprint.endDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Target className="size-4 shrink-0 text-muted-foreground" />

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Tasks
            </p>

            <p className="text-xs font-medium">
              {sprint._count.tasks}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}