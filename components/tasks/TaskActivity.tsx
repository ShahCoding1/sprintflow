"use client";

import { useCallback, useState } from "react";
import {
  Activity,
  Check,
  CircleDot,
  Loader2,
  RefreshCw,
} from "lucide-react";

type ActivityUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type TaskActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  user: ActivityUser | null;
};

type TaskActivityProps = {
  projectId: string;
  taskId: string;
};

const actionLabels: Record<string, string> = {
  CREATED: "created this task",
  UPDATED: "updated this task",
  DELETED: "deleted this task",
  ASSIGNED: "assigned this task",
  UNASSIGNED: "unassigned this task",
  STATUS_CHANGED: "changed the status",
  PRIORITY_CHANGED: "changed the priority",
  COMMENTED: "commented",
  MOVED: "moved this task",
  ADDED: "added to this task",
  REMOVED: "removed from this task",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function TaskActivity({
  projectId,
  taskId,
}: TaskActivityProps) {
  const [activities, setActivities] =
    useState<TaskActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/activity?limit=100`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Unable to load activity.",
        );
      }

      setActivities(data.activities ?? []);
      setLoaded(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load activity.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, taskId]);

  return (
    <section
      className="rounded-2xl border bg-card p-5 sm:p-6"
      aria-labelledby="task-activity-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Activity className="size-5 shrink-0" />
          <div className="min-w-0">
            <h2
              id="task-activity-heading"
              className="text-lg font-semibold"
            >
              Activity
            </h2>
            <p className="text-sm text-muted-foreground">
              History of changes made to this task.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadActivity()}
          disabled={loading}
          className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          {loaded ? "Refresh" : "Load Activity"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      {!loaded && !loading && !error && (
        <div className="mt-5 rounded-xl border border-dashed p-6 text-center">
          <CircleDot className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            Activity history is ready.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Load the activity timeline to view task changes.
          </p>
        </div>
      )}

      {loaded && activities.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed p-6 text-center">
          <Check className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">
            No activity yet.
          </p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="mt-5 space-y-4">
          {activities.map((activity) => {
            const actor =
              activity.user?.name ||
              activity.user?.email ||
              "A user";

            return (
              <article
                key={activity.id}
                className="flex gap-3"
              >
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {(actor[0] ?? "U").toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-6">
                    <span className="font-semibold">
                      {actor}
                    </span>{" "}
                    {actionLabels[activity.action] ??
                      activity.action.toLowerCase()}
                  </p>

                  <time
                    dateTime={activity.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    {formatDate(activity.createdAt)}
                  </time>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}