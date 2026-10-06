"use client";

import {
  CalendarDays,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

type FormErrors = {
  name?: string;
  key?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  general?: string;
};

type CreateProjectResponse = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setKey("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setErrors({});
    setLoading(false);
  }

  function handleClose() {
    if (loading) {
      return;
    }

    resetForm();
    onOpenChange(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!loading) {
          resetForm();
          onOpenChange(false);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onOpenChange]);

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};

    const trimmedName = name.trim();
    const normalizedKey = key.trim().toUpperCase();
    const trimmedDescription = description.trim();

    if (!trimmedName) {
      nextErrors.name = "Project name is required.";
    } else if (trimmedName.length < 2) {
      nextErrors.name =
        "Project name must be at least 2 characters.";
    } else if (trimmedName.length > 100) {
      nextErrors.name =
        "Project name must be less than 100 characters.";
    }

    if (!normalizedKey) {
      nextErrors.key = "Project key is required.";
    } else if (normalizedKey.length < 2) {
      nextErrors.key =
        "Project key must be at least 2 characters.";
    } else if (normalizedKey.length > 10) {
      nextErrors.key =
        "Project key must be less than 10 characters.";
    } else if (!/^[A-Z][A-Z0-9]*$/.test(normalizedKey)) {
      nextErrors.key =
        "Project key must start with a letter and contain only letters and numbers.";
    }

    if (trimmedDescription.length > 1000) {
      nextErrors.description =
        "Project description must be less than 1000 characters.";
    }

    if (startDate && endDate && endDate < startDate) {
      nextErrors.endDate =
        "End date must be on or after the start date.";
    }

    return nextErrors;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          key: key.trim().toUpperCase(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      const data: CreateProjectResponse =
        await response.json();

      if (!response.ok || !data.success) {
        if (data.errors) {
          const apiErrors: FormErrors = {};

          if (data.errors.name?.[0]) {
            apiErrors.name = data.errors.name[0];
          }

          if (data.errors.key?.[0]) {
            apiErrors.key = data.errors.key[0];
          }

          if (data.errors.description?.[0]) {
            apiErrors.description =
              data.errors.description[0];
          }

          if (data.errors.startDate?.[0]) {
            apiErrors.startDate =
              data.errors.startDate[0];
          }

          if (data.errors.endDate?.[0]) {
            apiErrors.endDate =
              data.errors.endDate[0];
          }

          setErrors(apiErrors);
        } else {
          setErrors({
            general:
              data.message ??
              "Unable to create the project.",
          });
        }

        setLoading(false);
        return;
      }

      resetForm();
      onOpenChange(false);
      onCreated();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Unable to create the project.",
      });

      setLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:max-h-[calc(100dvh-2rem)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-10 sm:w-10">
                <Plus className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
              </div>

              <div className="min-w-0">
                <h2
                  id="create-project-title"
                  className="text-base font-semibold sm:text-lg"
                >
                  Create project
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Create a new project in your current workspace.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable Form Content */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              {/* General Error */}
              {errors.general && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {errors.general}
                </div>
              )}

              {/* Project Name */}
              <div className="space-y-2">
                <label
                  htmlFor="project-name"
                  className="text-sm font-medium"
                >
                  Project name
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </label>

                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="e.g. SprintFlow Web App"
                  maxLength={100}
                  autoFocus
                  disabled={loading}
                  className={`h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.name
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : ""
                  }`}
                />

                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Project Key */}
              <div className="space-y-2">
                <label
                  htmlFor="project-key"
                  className="text-sm font-medium"
                >
                  Project key
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </label>

                <input
                  id="project-key"
                  type="text"
                  value={key}
                  onChange={(event) =>
                    setKey(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, ""),
                    )
                  }
                  placeholder="e.g. SFW"
                  maxLength={10}
                  disabled={loading}
                  className={`h-11 w-full rounded-lg border bg-background px-3 text-sm uppercase outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.key
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : ""
                  }`}
                />

                <p className="text-xs text-muted-foreground">
                  2–10 characters. Start with a letter.
                </p>

                {errors.key && (
                  <p className="text-xs text-destructive">
                    {errors.key}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="project-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe what this project is about..."
                  maxLength={1000}
                  rows={4}
                  disabled={loading}
                  className={`w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                    errors.description
                      ? "border-destructive focus:border-destructive focus:ring-destructive/20"
                      : ""
                  }`}
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Optional</span>

                  <span>
                    {description.length}/1000
                  </span>
                </div>

                {errors.description && (
                  <p className="text-xs text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Start Date */}
                <div className="space-y-2">
                  <label
                    htmlFor="project-start-date"
                    className="text-sm font-medium"
                  >
                    Start date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="project-start-date"
                      type="date"
                      value={startDate}
                      onChange={(event) =>
                        setStartDate(event.target.value)
                      }
                      disabled={loading}
                      className={`h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        errors.startDate
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                  </div>

                  {errors.startDate && (
                    <p className="text-xs text-destructive">
                      {errors.startDate}
                    </p>
                  )}
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label
                    htmlFor="project-end-date"
                    className="text-sm font-medium"
                  >
                    End date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      id="project-end-date"
                      type="date"
                      value={endDate}
                      onChange={(event) =>
                        setEndDate(event.target.value)
                      }
                      disabled={loading}
                      className={`h-11 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        errors.endDate
                          ? "border-destructive"
                          : ""
                      }`}
                    />
                  </div>

                  {errors.endDate && (
                    <p className="text-xs text-destructive">
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-muted/20 px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="h-10 w-full rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}