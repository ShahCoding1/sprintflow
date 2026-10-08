"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, RefreshCw } from "lucide-react";

type UserSummary = {
  totalSeconds: number;
  totalEntries: number;
  activeEntries: number;
  user: {
    userId: string;
    name: string | null;
    email: string | null;
  };
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

export default function UserTimeSummary({
  projectId,
}: Props) {
  const [summary, setSummary] =
    useState<UserSummary | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/time/summary?projectId=${encodeURIComponent(
          projectId,
        )}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload?.error ?? "Failed to load your time summary.",
        );
      }

      setSummary(payload.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load your time summary.",
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
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">
            Loading your tracked time...
          </span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border bg-card p-5">
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
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border p-2">
            <Clock3 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Your tracked time
            </h2>

            <p className="text-sm text-muted-foreground">
              {summary.user.name ||
                summary.user.email ||
                "Current user"}
            </p>
          </div>
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

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Total time
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {formatDuration(summary.totalSeconds)}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Entries
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.totalEntries}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">
            Active entries
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {summary.activeEntries}
          </p>
        </div>
      </div>
    </section>
  );
}