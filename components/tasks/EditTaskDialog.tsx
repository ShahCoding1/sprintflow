"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { updateTaskSchema } from "@/features/task/schemas/update-task.schema";

import type { BoardTask } from "./TaskCard";

type EditTaskDialogProps = {
  projectId: string;
  task: BoardTask;
  onUpdated: (task: BoardTask) => void;
};

type EditTaskFormInput = z.input<typeof updateTaskSchema>;
type EditTaskFormOutput = z.output<typeof updateTaskSchema>;

export default function EditTaskDialog({
  projectId,
  task,
  onUpdated,
}: EditTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTaskFormInput, unknown, EditTaskFormOutput>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      type: task.type,
      status: task.status,
      priority: task.priority,
      storyPoints: task.storyPoints,
      sprintId: null,
      parentId: null,
      assigneeId: task.assignee?.id ?? null,
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      position: task.position,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task.title,
        description: task.description ?? "",
        type: task.type,
        status: task.status,
        priority: task.priority,
        storyPoints: task.storyPoints,
        sprintId: null,
        parentId: null,
        assigneeId: task.assignee?.id ?? null,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        position: task.position,
      });
    }
  }, [open, reset, task]);

  const closeDialog = () => {
    if (isSubmitting) {
      return;
    }

    setOpen(false);
    setServerError(null);
  };

  const onSubmit = async (data: EditTaskFormOutput) => {
    setServerError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: data.title,
            description: data.description,
            type: data.type,
            status: data.status,
            priority: data.priority,
            sprintId: data.sprintId,
            parentId: data.parentId,
            assigneeId: data.assigneeId,
            storyPoints: data.storyPoints,
            dueDate: data.dueDate,
            position: data.position,
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
          result.message ?? "Unable to update the task.",
        );
      }

      onUpdated(result.task);
      setOpen(false);
    } catch (error) {
      console.error("Update task error:", error);

      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to update the task.",
      );
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label={`Edit ${task.title}`}
        onClick={() => {
          setServerError(null);
          setOpen(true);
        }}
        className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <Pencil className="size-4" />
      </button>

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
            aria-labelledby="edit-task-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2
                  id="edit-task-title"
                  className="text-lg font-semibold"
                >
                  Edit Task
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Update this task&apos;s details and workflow status.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close edit task dialog"
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
                  htmlFor={`edit-task-title-${task.id}`}
                  className="text-sm font-medium"
                >
                  Title
                </label>

                <input
                  id={`edit-task-title-${task.id}`}
                  type="text"
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
                  htmlFor={`edit-task-description-${task.id}`}
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id={`edit-task-description-${task.id}`}
                  rows={4}
                  {...register("description")}
                  className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />

                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label
                    htmlFor={`edit-task-type-${task.id}`}
                    className="text-sm font-medium"
                  >
                    Type
                  </label>

                  <select
                    id={`edit-task-type-${task.id}`}
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
                    htmlFor={`edit-task-status-${task.id}`}
                    className="text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id={`edit-task-status-${task.id}`}
                    {...register("status")}
                    className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor={`edit-task-priority-${task.id}`}
                    className="text-sm font-medium"
                  >
                    Priority
                  </label>

                  <select
                    id={`edit-task-priority-${task.id}`}
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
                    htmlFor={`edit-task-points-${task.id}`}
                    className="text-sm font-medium"
                  >
                    Story Points
                  </label>

                  <input
                    id={`edit-task-points-${task.id}`}
                    type="number"
                    min="0"
                    max="100"
                    step="1"
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Pencil className="size-4" />
                      Save Changes
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