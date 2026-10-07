"use client";

import {
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";

import type { BoardTask } from "@/components/tasks/TaskCard";

type CreateSprintTaskDialogProps = {
  projectId: string;
  sprintId: string;
  onCreated: (task: BoardTask) => void;
};

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

export default function CreateSprintTaskDialog({
  projectId,
  sprintId,
  onCreated,
}: CreateSprintTaskDialogProps) {
  const [open, setOpen] =
    useState(false);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [type, setType] =
    useState<TaskType>("TASK");

  const [priority, setPriority] =
    useState<TaskPriority>("MEDIUM");

  const [storyPoints, setStoryPoints] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setType("TASK");
    setPriority("MEDIUM");
    setStoryPoints("");
    setError("");
  }

  function close() {
    if (loading) {
      return;
    }

    setOpen(false);
    reset();
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Task title is required.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title: title.trim(),
            description:
              description.trim() || undefined,
            type,
            status: "TODO",
            priority,
            sprintId,
            storyPoints:
              storyPoints.trim()
                ? Number(storyPoints)
                : null,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to create task.",
        );
      }

      if (data.task) {
        onCreated(data.task);
      }

      setOpen(false);
      reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create task.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Add task
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-sprint-task-title"
            className="w-full max-w-lg rounded-2xl border bg-card p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5">
              <h2
                id="create-sprint-task-title"
                className="text-lg font-semibold"
              >
                Create Sprint Task
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Create a task directly inside
                this sprint.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="sprint-task-title"
                  className="text-sm font-medium"
                >
                  Title
                </label>

                <input
                  id="sprint-task-title"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Build authentication flow"
                  className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="sprint-task-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="sprint-task-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe the task..."
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="sprint-task-type"
                    className="text-sm font-medium"
                  >
                    Type
                  </label>

                  <select
                    id="sprint-task-type"
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target
                          .value as TaskType,
                      )
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                    disabled={loading}
                  >
                    <option value="TASK">
                      Task
                    </option>
                    <option value="STORY">
                      Story
                    </option>
                    <option value="BUG">
                      Bug
                    </option>
                    <option value="EPIC">
                      Epic
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sprint-task-priority"
                    className="text-sm font-medium"
                  >
                    Priority
                  </label>

                  <select
                    id="sprint-task-priority"
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target
                          .value as TaskPriority,
                      )
                    }
                    className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                    disabled={loading}
                  >
                    <option value="LOW">
                      Low
                    </option>
                    <option value="MEDIUM">
                      Medium
                    </option>
                    <option value="HIGH">
                      High
                    </option>
                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sprint-task-points"
                    className="text-sm font-medium"
                  >
                    Points
                  </label>

                  <input
                    id="sprint-task-points"
                    type="number"
                    min="0"
                    max="100"
                    value={storyPoints}
                    onChange={(event) =>
                      setStoryPoints(
                        event.target.value,
                      )
                    }
                    placeholder="0"
                    className="mt-1.5 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="h-10 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !title.trim()
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}