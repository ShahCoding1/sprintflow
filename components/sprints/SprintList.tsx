"use client";

import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Target,
} from "lucide-react";

import CreateSprintDialog from "./CreateSprintDialog";
import SprintCard, {
  type Sprint,
} from "./SprintCard";

type SprintListProps = {
  projectId: string;
  initialSprints: Sprint[];
};

type SprintGroup = {
  title: string;
  status: Sprint["status"];
  icon: typeof Clock3;
  sprints: Sprint[];
};

export default function SprintList({
  projectId,
  initialSprints,
}: SprintListProps) {
  const [sprints, setSprints] =
    useState<Sprint[]>(initialSprints);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadSprints = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/projects/${projectId}/sprints`,
          {
            cache: "no-store",
          },
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load sprints.",
          );
        }

        setSprints(
          data.sprints ?? [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load sprints.",
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  function handleCreated(
    sprint: Sprint,
  ) {
    setSprints((current) => [
      sprint,
      ...current,
    ]);
  }

  function handleUpdated(
    updatedSprint: Sprint,
  ) {
    setSprints((current) =>
      current.map((sprint) =>
        sprint.id === updatedSprint.id
          ? updatedSprint
          : sprint,
      ),
    );
  }

  async function handleDelete(
    sprint: Sprint,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${sprint.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/sprints/${sprint.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete sprint.",
        );
      }

      setSprints((current) =>
        current.filter(
          (item) =>
            item.id !== sprint.id,
        ),
      );
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Unable to delete sprint.",
      );
    }
  }

  const groups =
    useMemo<SprintGroup[]>(
      () => [
        {
          title: "Active",
          status: "ACTIVE",
          icon: Target,
          sprints:
            sprints.filter(
              (sprint) =>
                sprint.status ===
                "ACTIVE",
            ),
        },
        {
          title: "Planned",
          status: "PLANNED",
          icon: Clock3,
          sprints:
            sprints.filter(
              (sprint) =>
                sprint.status ===
                "PLANNED",
            ),
        },
        {
          title: "Completed",
          status: "COMPLETED",
          icon: CheckCircle2,
          sprints:
            sprints.filter(
              (sprint) =>
                sprint.status ===
                "COMPLETED",
            ),
        },
      ],
      [sprints],
    );

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <p className="text-sm font-medium text-destructive">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            void loadSprints();
          }}
          disabled={loading}
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4 disabled:opacity-50"
        >
          {loading && (
            <Loader2 className="size-3.5 animate-spin" />
          )}
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Sprints
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Plan and manage delivery cycles
            for this project.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void loadSprints();
            }}
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Loader2
              className={[
                "size-4",
                loading
                  ? "animate-spin"
                  : "hidden",
              ].join(" ")}
            />

            Refresh
          </button>

          <CreateSprintDialog
            projectId={projectId}
            onCreated={handleCreated}
          />
        </div>
      </div>

      {sprints.length === 0 ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Target className="size-6 text-primary" />
          </div>

          <h3 className="mt-4 text-base font-semibold">
            No sprints yet
          </h3>

          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Create your first sprint to
            start planning work for this
            project.
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const Icon = group.icon;

          if (
            group.sprints.length === 0
          ) {
            return null;
          }

          return (
            <div
              key={group.status}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />

                <h3 className="text-sm font-semibold">
                  {group.title}
                </h3>

                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {group.sprints.length}
                </span>
              </div>

              <div className="grid gap-4">
                {group.sprints.map(
                  (sprint) => (
                    <SprintCard
                      key={sprint.id}
                      projectId={projectId}
                      sprint={sprint}
                      onUpdated={
                        handleUpdated
                      }
                      onDelete={
                        handleDelete
                      }
                    />
                  ),
                )}
              </div>
            </div>
          );
        })
      )}
    </section>
  );
}