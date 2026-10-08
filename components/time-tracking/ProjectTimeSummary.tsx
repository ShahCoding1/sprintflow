"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Clock3,
  RefreshCw,
  Users,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

type ProjectSummary = {
  totalSeconds: number;
  totalEntries: number;
  activeEntries: number;
  users: Array<{
    userId: string;
    name: string | null;
    email: string;
    durationSeconds: number;
    entryCount: number;
  }>;
  tasks: Array<{
    taskId: string;
    title: string;
    durationSeconds: number;
    entryCount: number;
  }>;
};

type Props = {
  projectId: string;
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export default function ProjectTimeSummary({
  projectId,
}: Props) {
  const [summary, setSummary] =
    useState<ProjectSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/time-summary`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "Failed to load time summary.",
        );
      }

      setSummary(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load time summary.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading time summary...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border bg-card p-6">
        <div className="space-y-3">
          <p className="text-sm text-destructive">{error}</p>

          <button
            type="button"
            onClick={() => void loadSummary()}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Time Tracking Summary
          </h2>

          <p className="text-sm text-muted-foreground">
            Project-wide tracked time and workload.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSummary()}
          className="inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <Clock3 className="mb-3 h-5 w-5" />

          <p className="text-sm text-muted-foreground">
            Total tracked
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {formatDuration(summary.totalSeconds)}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <ListTodo className="mb-3 h-5 w-5" />

          <p className="text-sm text-muted-foreground">
            Time entries
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.totalEntries}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <Users className="mb-3 h-5 w-5" />

          <p className="text-sm text-muted-foreground">
            Contributors
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.users.length}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <CheckCircle2 className="mb-3 h-5 w-5" />

          <p className="text-sm text-muted-foreground">
            Tracked tasks
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.tasks.length}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h3 className="font-semibold">By contributor</h3>
          </div>

          <div className="divide-y">
            {summary.users.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No tracked time yet.
              </p>
            ) : (
              summary.users.map((user) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {user.name || user.email}
                    </p>

                    <p className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-semibold">
                      {formatDuration(
                        user.durationSeconds,
                      )}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {user.entryCount} entries
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border">
          <div className="border-b p-4">
            <h3 className="font-semibold">By task</h3>
          </div>

          <div className="divide-y">
            {summary.tasks.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No tracked tasks yet.
              </p>
            ) : (
              summary.tasks.map((task) => (
                <div
                  key={task.taskId}
                  className="flex items-center justify-between gap-4 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {task.title}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {task.entryCount} entries
                    </p>
                  </div>

                  <p className="shrink-0 font-semibold">
                    {formatDuration(
                      task.durationSeconds,
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}