"use client";

import {
  Check,
  Loader2,
  Plus,
  RefreshCw,
  Tags,
  X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type TaskLabel = {
  id: string;
  name: string;
  color: string;
};

type TaskLabelsProps = {
  projectId: string;
  taskId: string;
  initialLabels?: TaskLabel[];
  compact?: boolean;
};

type LabelsResponse = {
  labels?: TaskLabel[];
  error?: string;
};

export default function TaskLabels({
  projectId,
  taskId,
  initialLabels = [],
  compact = false,
}: TaskLabelsProps) {
  const [labels, setLabels] =
    useState<TaskLabel[]>(initialLabels);

  const [availableLabels, setAvailableLabels] =
    useState<TaskLabel[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [savingLabelId, setSavingLabelId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [selectorOpen, setSelectorOpen] =
    useState(false);

  const loadLabels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/labels`,
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as LabelsResponse;

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to load task labels.",
        );
      }

      setLabels(result.labels ?? []);
    } catch (error) {
      console.error(
        "Load task labels error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load task labels.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableLabels = async () => {
    setError(null);

    try {
      const response = await fetch(
        "/api/labels",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as LabelsResponse;

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to load labels.",
        );
      }

      setAvailableLabels(
        result.labels ?? [],
      );
    } catch (error) {
      console.error(
        "Load available labels error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load labels.",
      );
    }
  };

  const openSelector = async () => {
    setSelectorOpen(true);
    await Promise.all([
      loadLabels(),
      loadAvailableLabels(),
    ]);
  };

  const addLabel = async (
    label: TaskLabel,
  ) => {
    setSavingLabelId(label.id);
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
        (await response.json()) as TaskLabel & {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to assign label.",
        );
      }

      setLabels((current) =>
        [...current, result].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
    } catch (error) {
      console.error(
        "Assign task label error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to assign label.",
      );
    } finally {
      setSavingLabelId(null);
    }
  };

  const removeLabel = async (
    labelId: string,
  ) => {
    setSavingLabelId(labelId);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/labels`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            labelId,
          }),
        },
      );

      const result =
        (await response.json().catch(
          () => ({}),
        )) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to remove label.",
        );
      }

      setLabels((current) =>
        current.filter(
          (label) => label.id !== labelId,
        ),
      );
    } catch (error) {
      console.error(
        "Remove task label error:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove label.",
      );
    } finally {
      setSavingLabelId(null);
    }
  };

  const assignedIds = new Set(
    labels.map((label) => label.id),
  );

  const unassignedLabels =
    availableLabels.filter(
      (label) => !assignedIds.has(label.id),
    );

  return (
    <section
      className={
        compact
          ? "space-y-2"
          : "rounded-2xl border bg-card p-5 sm:p-6"
      }
      aria-labelledby={`task-labels-${taskId}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Tags className="size-4 shrink-0 text-muted-foreground" />

          <h2
            id={`task-labels-${taskId}`}
            className={
              compact
                ? "text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                : "text-base font-semibold"
            }
          >
            Labels
          </h2>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={loadLabels}
            disabled={loading}
            aria-label="Refresh task labels"
            title="Refresh labels"
          >
            <RefreshCw
              className={[
                "size-4",
                loading
                  ? "animate-spin"
                  : "",
              ].join(" ")}
            />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openSelector}
            disabled={loading}
          >
            <Plus className="mr-1.5 size-4" />
            Add label
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {labels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              style={{
                borderColor: `${label.color}55`,
                backgroundColor: `${label.color}15`,
                color: label.color,
              }}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    label.color,
                }}
                aria-hidden="true"
              />

              <span className="truncate">
                {label.name}
              </span>

              <button
                type="button"
                onClick={() =>
                  removeLabel(label.id)
                }
                disabled={
                  savingLabelId === label.id
                }
                className="ml-0.5 rounded-full p-0.5 transition hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${label.name} label`}
              >
                {savingLabelId === label.id ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <X className="size-3" />
                )}
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-5 text-center">
          <Tags className="mx-auto size-6 text-muted-foreground/50" />

          <p className="mt-2 text-sm text-muted-foreground">
            No labels assigned.
          </p>
        </div>
      )}

      {selectorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectorOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`label-selector-${taskId}`}
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3
                  id={`label-selector-${taskId}`}
                  className="font-semibold"
                >
                  Manage Task Labels
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Assign or remove workspace labels.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectorOpen(false)
                }
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close label selector"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4">
              {availableLabels.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                  <Tags className="mx-auto size-7 text-muted-foreground/50" />

                  <p className="mt-2 text-sm font-medium">
                    No workspace labels
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Create labels from Settings → Labels.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableLabels.map(
                    (label) => {
                      const assigned =
                        assignedIds.has(
                          label.id,
                        );

                      const saving =
                        savingLabelId ===
                        label.id;

                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => {
                            if (assigned) {
                              void removeLabel(
                                label.id,
                              );
                            } else {
                              void addLabel(
                                label,
                              );
                            }
                          }}
                          disabled={saving}
                          className="flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className="size-3 shrink-0 rounded-full"
                              style={{
                                backgroundColor:
                                  label.color,
                              }}
                              aria-hidden="true"
                            />

                            <span className="truncate text-sm font-medium">
                              {label.name}
                            </span>
                          </span>

                          {saving ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : assigned ? (
                            <Check className="size-4 text-primary" />
                          ) : (
                            <Plus className="size-4 text-muted-foreground" />
                          )}
                        </button>
                      );
                    },
                  )}
                </div>
              )}

              {unassignedLabels.length ===
                0 &&
                availableLabels.length > 0 && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    All available labels are assigned.
                  </p>
                )}
            </div>

            <div className="flex justify-end border-t px-5 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSelectorOpen(false)
                }
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}