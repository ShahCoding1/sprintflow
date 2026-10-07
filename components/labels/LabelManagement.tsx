"use client";

import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Tags } from "lucide-react";

type Label = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type LabelManagementProps = {
  initialLabels?: Label[];
};

const DEFAULT_COLOR = "#6366F1";

const COLOR_OPTIONS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
];

export default function LabelManagement({
  initialLabels = [],
}: LabelManagementProps) {
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadLabels() {
    try {
      setLoadingLabels(true);
      setError("");

      const response = await fetch("/api/labels", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load labels.");
      }

      setLabels(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load labels.",
      );
    } finally {
      setLoadingLabels(false);
    }
  }

  function resetForm() {
    setName("");
    setColor(DEFAULT_COLOR);
    setEditingId(null);
    setError("");
  }

  function startEditing(label: Label) {
    setEditingId(label.id);
    setName(label.name);
    setColor(label.color);
    setError("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Label name is required.");
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      setError("Please select a valid color.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const url = editingId
        ? `/api/labels/${editingId}`
        : "/api/labels";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Failed to ${
              editingId ? "update" : "create"
            } label.`,
        );
      }

      if (editingId) {
        setLabels((current) =>
          current.map((label) =>
            label.id === editingId ? data : label,
          ),
        );
      } else {
        setLabels((current) =>
          [...current, data].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(labelId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this label?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(labelId);
      setError("");

      const response = await fetch(
        `/api/labels/${labelId}`,
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
          data?.error || "Failed to delete label.",
        );
      }

      setLabels((current) =>
        current.filter((label) => label.id !== labelId),
      );

      if (editingId === labelId) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete label.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Tags className="size-5 text-primary" />
              </div>

              <div>
                <h1 className="text-xl font-semibold">
                  Labels
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create and manage labels used across your
                  workspace.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadLabels}
            disabled={loadingLabels}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingLabels ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="font-semibold">
              {editingId ? "Edit Label" : "Create Label"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editingId
                ? "Update the label name or color."
                : "Add a reusable label to your workspace."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <label
                htmlFor="label-name"
                className="text-sm font-medium"
              >
                Name
              </label>

              <input
                id="label-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Frontend"
                maxLength={50}
                disabled={loading}
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">
                Color
              </label>

              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-label={`Select ${option}`}
                    aria-pressed={color === option}
                    onClick={() => setColor(option)}
                    disabled={loading}
                    className={[
                      "size-9 rounded-full border-2 transition-transform hover:scale-110 disabled:opacity-50",
                      color === option
                        ? "border-foreground ring-2 ring-primary/20"
                        : "border-transparent",
                    ].join(" ")}
                    style={{
                      backgroundColor: option,
                    }}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                <span
                  className="size-5 rounded-full border"
                  style={{
                    backgroundColor: color,
                  }}
                />

                <span className="font-mono text-sm">
                  {color}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}

                {editingId
                  ? "Save Changes"
                  : "Create Label"}
              </button>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-2xl border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                Workspace Labels
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {labels.length}{" "}
                {labels.length === 1 ? "label" : "labels"}
              </p>
            </div>
          </div>

          {loadingLabels && labels.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : labels.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
              <Tags className="size-9 text-muted-foreground/50" />

              <h3 className="mt-3 text-sm font-semibold">
                No labels yet
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Create your first workspace label using the
                form.
              </p>
            </div>
          ) : (
            <div className="divide-y rounded-xl border">
              {labels.map((label) => (
                <div
                  key={label.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="size-4 shrink-0 rounded-full border"
                      style={{
                        backgroundColor: label.color,
                      }}
                    />

                    <span className="truncate text-sm font-medium">
                      {label.name}
                    </span>

                    <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                      {label.color}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(label)}
                      disabled={deletingId === label.id}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                    >
                      <Pencil className="size-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(label.id)}
                      disabled={deletingId === label.id}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
                    >
                      {deletingId === label.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}