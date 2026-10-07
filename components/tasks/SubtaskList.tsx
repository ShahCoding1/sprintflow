"use client";

import { useCallback, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

type SubtaskUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type Subtask = {
  id: string;
  title: string;
  status:
    | "TODO"
    | "IN_PROGRESS"
    | "IN_REVIEW"
    | "DONE"
    | "BLOCKED";
  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";
  description: string | null;
  storyPoints: number | null;
  dueDate: string | null;
  position: number;
  assignee: SubtaskUser | null;
};

type SubtaskListProps = {
  projectId: string;
  taskId: string;
};

const statusLabels: Record<
  Subtask["status"],
  string
> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export default function SubtaskList({
  projectId,
  taskId,
}: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<
    Subtask[]
  >([]);

  const [title, setTitle] = useState("");
  const [expanded, setExpanded] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] = useState("");

  const loadSubtasks = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/subtasks`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ??
              "Unable to load subtasks.",
          );
        }

        setSubtasks(data.subtasks ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load subtasks.",
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId, taskId],
  );

  const createSubtask = async () => {
    const trimmedTitle = title.trim();

    if (trimmedTitle.length < 2) {
      setError(
        "Subtask title must be at least 2 characters.",
      );
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/subtasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            priority: "MEDIUM",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to create subtask.",
        );
      }

      setSubtasks((current) => [
        ...current,
        data.subtask,
      ]);

      setTitle("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create subtask.",
      );
    } finally {
      setCreating(false);
    }
  };

  const deleteSubtask = async (
    subtaskId: string,
  ) => {
    const confirmed = window.confirm(
      "Delete this subtask?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(subtaskId);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${subtaskId}`,
        {
          method: "DELETE",
        },
      );

      const data =
        response.status === 204
          ? null
          : await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ??
            "Unable to delete subtask.",
        );
      }

      setSubtasks((current) =>
        current.filter(
          (subtask) =>
            subtask.id !== subtaskId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete subtask.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const completedCount = subtasks.filter(
    (subtask) => subtask.status === "DONE",
  ).length;

  return (
    <section
      className="rounded-2xl border bg-card p-5 sm:p-6"
      aria-labelledby="subtasks-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() =>
            setExpanded((value) => !value)
          }
          className="flex min-w-0 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="size-5 shrink-0" />
          ) : (
            <ChevronRight className="size-5 shrink-0" />
          )}

          <div className="min-w-0">
            <h2
              id="subtasks-heading"
              className="text-lg font-semibold"
            >
              Subtasks
            </h2>

            <p className="text-sm text-muted-foreground">
              {completedCount} of{" "}
              {subtasks.length} completed
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() =>
            void loadSubtasks()
          }
          disabled={loading}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}

          Refresh
        </button>
      </div>

      {expanded && (
        <>
          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void createSubtask();
                }
              }}
              placeholder="Add a subtask..."
              aria-label="Subtask title"
              className="min-h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              disabled={creating}
            />

            <button
              type="button"
              onClick={() =>
                void createSubtask()
              }
              disabled={
                creating ||
                title.trim().length < 2
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}

              Add
            </button>
          </div>

          {subtasks.length === 0 &&
            !loading && (
              <div className="mt-5 rounded-xl border border-dashed p-6 text-center">
                <Circle className="mx-auto size-7 text-muted-foreground" />

                <p className="mt-2 text-sm font-medium">
                  No subtasks yet.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Break this task into smaller pieces.
                </p>
              </div>
            )}

          {subtasks.length > 0 && (
            <div className="mt-5 divide-y rounded-xl border">
              {subtasks.map((subtask) => {
                const completed =
                  subtask.status === "DONE";

                return (
                  <div
                    key={subtask.id}
                    className="flex items-start gap-3 p-3 sm:p-4"
                  >
                    <div className="mt-0.5 shrink-0">
                      {completed ? (
                        <Check className="size-5 text-green-600" />
                      ) : (
                        <Circle className="size-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          completed
                            ? "break-words text-sm line-through text-muted-foreground"
                            : "break-words text-sm font-medium"
                        }
                      >
                        {subtask.title}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>
                          {
                            statusLabels[
                              subtask.status
                            ]
                          }
                        </span>

                        <span>
                          {subtask.priority}
                        </span>

                        {subtask.storyPoints !==
                          null && (
                          <span>
                            {subtask.storyPoints}{" "}
                            points
                          </span>
                        )}

                        {subtask.assignee && (
                          <span>
                            {subtask.assignee.name ??
                              subtask.assignee.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void deleteSubtask(
                          subtask.id,
                        )
                      }
                      disabled={
                        deletingId ===
                        subtask.id
                      }
                      aria-label={`Delete ${subtask.title}`}
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      subtask.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}