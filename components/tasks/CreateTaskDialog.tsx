"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { createTaskSchema } from "@/features/task/schemas/create-task.schema";

import type { BoardTask } from "./TaskCard";

type CreateTaskDialogProps = {
  projectId: string;
  onCreated: (task: BoardTask) => void;
};

type CreateTaskFormInput = z.input<typeof createTaskSchema>;
type CreateTaskFormOutput = z.output<typeof createTaskSchema>;

export default function CreateTaskDialog({
  projectId,
  onCreated,
}: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormInput, unknown, CreateTaskFormOutput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "TASK",
      status: "TODO",
      priority: "MEDIUM",
      storyPoints: null,
      sprintId: null,
      parentId: null,
      assigneeId: null,
      dueDate: null,
    },
  });

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }

    setOpen(false);
    setServerError(null);
    reset();
  };

  const onSubmit = async (data: CreateTaskFormOutput) => {
    setServerError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description || undefined,
            type: data.type,
            status: data.status,
            priority: data.priority,
            storyPoints: data.storyPoints,
            sprintId: data.sprintId,
            parentId: data.parentId,
            assigneeId: data.assigneeId,
            dueDate: data.dueDate,
          }),
        },
      );

      const result = (await response.json()) as {
        success: boolean;
        message?: string;
        task?: BoardTask;
      };

      if (!response.ok || !result.success || !result.task) {
        throw new Error(
          result.message ?? "Unable to create the task.",
        );
      }

      onCreated(result.task);

      setOpen(false);
      reset();
    } catch (error) {
      console.error("Create task error:", error);

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to create the task.",
      );
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setServerError(null);
          setOpen(true);
        }}
      >
        <Plus className="size-4" />
        Create Task
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2
                  id="create-task-title"
                  className="text-lg font-semibold"
                >
                  Create Task
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Add a new task to this project.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close create task dialog"
                disabled={isSubmitting}
                onClick={closeDialog}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5 p-6"
            >
              {serverError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="task-title"
                  className="text-sm font-medium"
                >
                  Title
                </label>

                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g. Implement authentication"
                  autoFocus
                  {...register("title")}
                  className="flex h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />

                {errors.title && (
                  <p className="text-xs text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="task-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="task-description"
                  rows={4}
                  placeholder="Describe what needs to be done..."
                  {...register("description")}
                  className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />

                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label
                    htmlFor="task-type"
                    className="text-sm font-medium"
                  >
                    Type
                  </label>

                  <select
                    id="task-type"
                    {...register("type")}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    <option value="EPIC">Epic</option>
                    <option value="STORY">Story</option>
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="SUBTASK">Subtask</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="task-priority"
                    className="text-sm font-medium"
                  >
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    {...register("priority")}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="task-story-points"
                    className="text-sm font-medium"
                  >
                    Story Points
                  </label>

                  <input
                    id="task-story-points"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="0"
                    {...register("storyPoints", {
                      setValueAs: (value) =>
                        value === "" ? null : Number(value),
                    })}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  />

                  {errors.storyPoints && (
                    <p className="text-xs text-destructive">
                      {errors.storyPoints.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={closeDialog}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="size-4" />
                      Create Task
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}