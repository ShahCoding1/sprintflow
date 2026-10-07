"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";

type TaskLabel = {
  id: string;
  name: string;
  color: string;
};

type TaskLabelsProps = {
  projectId: string;
  taskId: string;
  initialLabels?: TaskLabel[];
};

type AvailableLabelsResponse =
  | TaskLabel[]
  | {
      labels?: TaskLabel[];
      error?: string;
    };

export default function TaskLabels({
  projectId,
  taskId,
  initialLabels = [],
}: TaskLabelsProps) {
  const [labels, setLabels] =
    useState<TaskLabel[]>(initialLabels);

  const [availableLabels, setAvailableLabels] =
    useState<TaskLabel[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isOpen, setIsOpen] =
    useState(false);

  const [isUpdating, setIsUpdating] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLabels() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks/${taskId}/labels`,
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as
            | TaskLabel[]
            | { labels?: TaskLabel[]; error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(result) && result.error
              ? result.error
              : "Unable to load task labels.",
          );
        }

        const taskLabels = Array.isArray(result)
          ? result
          : result.labels ?? [];

        if (!cancelled) {
          setLabels(taskLabels);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load task labels.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLabels();

    return () => {
      cancelled = true;
    };
  }, [projectId, taskId]);

  async function loadAvailableLabels() {
    try {
      const response = await fetch(
        "/api/labels",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as AvailableLabelsResponse;

      if (!response.ok) {
        throw new Error(
          !Array.isArray(result) && result.error
            ? result.error
            : "Unable to load labels.",
        );
      }

      const nextLabels = Array.isArray(result)
        ? result
        : result.labels ?? [];

      setAvailableLabels(nextLabels);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load labels.",
      );
    }
  }

  async function handleOpen() {
    setIsOpen((current) => !current);

    if (!isOpen) {
      await loadAvailableLabels();
    }
  }

  async function handleAssign(label: TaskLabel) {
    if (
      labels.some(
        (existingLabel) =>
          existingLabel.id === label.id,
      )
    ) {
      return;
    }

    setIsUpdating(label.id);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/labels`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            labelId: label.id,
          }),
        },
      );

      const result =
        (await response.json()) as {
          label?: TaskLabel;
          error?: string;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            result.message ??
            "Unable to assign label.",
        );
      }

      const assignedLabel =
        result.label ?? label;

      setLabels((current) => [
        ...current,
        assignedLabel,
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to assign label.",
      );
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleRemove(labelId: string) {
    setIsUpdating(labelId);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/labels?labelId=${encodeURIComponent(
          labelId,
        )}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as {
          error?: string;
          message?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            result.message ??
            "Unable to remove label.",
        );
      }

      setLabels((current) =>
        current.filter(
          (label) => label.id !== labelId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove label.",
      );
    } finally {
      setIsUpdating(null);
    }
  }

  const assignedIds = new Set(
    labels.map((label) => label.id),
  );

  const selectableLabels =
    availableLabels.filter(
      (label) => !assignedIds.has(label.id),
    );

  return (
    <section
      aria-label="Task labels"
      className="rounded-xl border bg-card p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold">
            Labels
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            Organize this task with project labels.
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => void handleOpen()}
            disabled={isLoading}
            aria-expanded={isOpen}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}

            Add Label

            <ChevronDown
              className={`size-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border bg-popover p-2 shadow-lg">
              {selectableLabels.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  {availableLabels.length === 0
                    ? "No labels available. Create labels in Settings → Labels."
                    : "All available labels are already assigned."}
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {selectableLabels.map(
                    (label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() =>
                          void handleAssign(label)
                        }
                        disabled={
                          isUpdating === label.id
                        }
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span
                          aria-hidden="true"
                          className="size-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor:
                              label.color,
                          }}
                        />

                        <span className="min-w-0 flex-1 truncate">
                          {label.name}
                        </span>

                        {isUpdating ===
                          label.id && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div className="mt-4 flex min-h-10 flex-wrap items-center gap-2">
        {labels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No labels assigned.
          </p>
        ) : (
          labels.map((label) => (
            <div
              key={label.id}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-full"
                style={{
                  backgroundColor: label.color,
                }}
              />

              <span className="max-w-48 truncate">
                {label.name}
              </span>

              <button
                type="button"
                onClick={() =>
                  void handleRemove(label.id)
                }
                disabled={
                  isUpdating === label.id
                }
                aria-label={`Remove ${label.name} label`}
                className="rounded-full p-0.5 transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdating === label.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <X className="size-3.5" />
                )}
              </button>

              <Check
                aria-hidden="true"
                className="hidden size-3.5 text-muted-foreground sm:block"
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}