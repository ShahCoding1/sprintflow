"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Loader2, Save, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  updateProjectSchema,
  type UpdateProjectInput,
} from "@/features/project/schemas/update-project.schema";

type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | string | null;
  endDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type EditProjectDialogProps = {
  open: boolean;
  project: Project;
  onOpenChange: (open: boolean) => void;
  onUpdated: (project: Project) => void;
};

function toNullableDate(
  value: Date | string | null | undefined,
) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date(`${value}T00:00:00`);
}

type UpdateProjectFormInput =
  z.input<typeof updateProjectSchema>;

type UpdateProjectFormOutput =
  z.output<typeof updateProjectSchema>;

export default function EditProjectDialog({
  open,
  project,
  onOpenChange,
  onUpdated,
}: EditProjectDialogProps) {
  const [serverError, setServerError] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    UpdateProjectFormInput,
    unknown,
    UpdateProjectFormOutput
  >({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      key: project.key,
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate
        ? new Date(project.startDate)
        : undefined,
      endDate: project.endDate
        ? new Date(project.endDate)
        : undefined,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      name: project.name,
      key: project.key,
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate
        ? new Date(project.startDate)
        : undefined,
      endDate: project.endDate
        ? new Date(project.endDate)
        : undefined,
    });
  }, [open, project, reset]);

  function handleClose() {
    if (isSaving) {
      return;
    }

    setServerError(null);
    onOpenChange(false);
  }

  async function onSubmit(
    data: UpdateProjectInput,
  ) {
    try {
      setIsSaving(true);
      setServerError(null);

      const response = await fetch(
        `/api/projects/${project.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: data.name,
            key: data.key,
            description: data.description ?? "",
            status: data.status,
            startDate: toNullableDate(
              data.startDate,
            ),
            endDate: toNullableDate(
              data.endDate,
            ),
          }),
        },
      );

      const result: {
        success?: boolean;
        message?: string;
        project?: Project;
      } = await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.project
      ) {
        throw new Error(
          result.message ??
            "Unable to update the project.",
        );
      }

      onUpdated(result.project);
      onOpenChange(false);
      setServerError(null);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Unable to update the project.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
    >
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border bg-background shadow-xl sm:max-h-[90vh] sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="edit-project-title"
              className="text-lg font-semibold"
            >
              Edit project
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Update your project information and settings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            aria-label="Close edit project dialog"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-h-0 overflow-y-auto"
        >
          <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
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
                htmlFor="edit-project-name"
                className="text-sm font-medium"
              >
                Project name
              </label>

              <input
                id="edit-project-name"
                type="text"
                autoComplete="off"
                disabled={isSaving}
                {...register("name")}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-project-key"
                className="text-sm font-medium"
              >
                Project key
              </label>

              <input
                id="edit-project-key"
                type="text"
                autoComplete="off"
                disabled={isSaving}
                {...register("key")}
                className="h-10 w-full rounded-lg border bg-background px-3 font-mono text-sm uppercase outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="text-xs text-muted-foreground">
                Use 2–10 characters. Start with a letter.
              </p>

              {errors.key && (
                <p className="text-xs text-destructive">
                  {errors.key.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-project-description"
                className="text-sm font-medium"
              >
                Description
              </label>

              <textarea
                id="edit-project-description"
                rows={4}
                disabled={isSaving}
                {...register("description")}
                className="w-full resize-y rounded-lg border bg-background px-3 py-2.5 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                placeholder="Describe what this project is about..."
              />

              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-project-status"
                className="text-sm font-medium"
              >
                Status
              </label>

              <select
                id="edit-project-status"
                disabled={isSaving}
                {...register("status")}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="PLANNING">
                  Planning
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="ARCHIVED">
                  Archived
                </option>
              </select>

              {errors.status && (
                <p className="text-xs text-destructive">
                  {errors.status.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="edit-project-start-date"
                  className="text-sm font-medium"
                >
                  Start date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="edit-project-start-date"
                    type="date"
                    disabled={isSaving}
                    {...register("startDate")}
                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {errors.startDate && (
                  <p className="text-xs text-destructive">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-project-end-date"
                  className="text-sm font-medium"
                >
                  End date
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="edit-project-end-date"
                    type="date"
                    disabled={isSaving}
                    {...register("endDate")}
                    className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                {errors.endDate && (
                  <p className="text-xs text-destructive">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}