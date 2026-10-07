"use client";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type AuditAction =
  | "CREATED"
  | "UPDATED"
  | "DELETED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "COMMENTED"
  | "MOVED"
  | "ADDED"
  | "REMOVED";

type AuditItem = {
  id: string;
  organizationId: string;
  userId: string | null;
  taskId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  task: {
    id: string;
    title: string;
  } | null;
};

type AuditResponse = {
  items: AuditItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const ACTIONS: Array<{
  value: AuditAction | "";
  label: string;
}> = [
  { value: "", label: "All actions" },
  { value: "CREATED", label: "Created" },
  { value: "UPDATED", label: "Updated" },
  { value: "DELETED", label: "Deleted" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "UNASSIGNED", label: "Unassigned" },
  {
    value: "STATUS_CHANGED",
    label: "Status changed",
  },
  {
    value: "PRIORITY_CHANGED",
    label: "Priority changed",
  },
  { value: "COMMENTED", label: "Commented" },
  { value: "MOVED", label: "Moved" },
  { value: "ADDED", label: "Added" },
  { value: "REMOVED", label: "Removed" },
];

function formatAction(action: AuditAction) {
  return action
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getActorName(item: AuditItem) {
  return (
    item.user?.name ||
    item.user?.email ||
    "System"
  );
}

export default function AuditLog() {
  const [items, setItems] = useState<AuditItem[]>([]);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<
    AuditAction | ""
  >("");

  const [pagination, setPagination] =
    useState<AuditResponse["pagination"] | null>(
      null,
    );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAudit = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "25");

      if (action) {
        params.set("action", action);
      }

      const response = await fetch(
        `/api/audit?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as
        | AuditResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Failed to load audit logs.",
        );
      }

      if (
        !("items" in data) ||
        !("pagination" in data)
      ) {
        throw new Error(
          "Invalid audit response.",
        );
      }

      setItems(data.items);
      setPagination(data.pagination);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load audit logs.",
      );
    } finally {
      setLoading(false);
    }
  }, [action, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAudit();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAudit]);

  const handleActionChange = (
    value: AuditAction | "",
  ) => {
    setPage(1);
    setAction(value);
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Audit Log
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review important activity across your
            workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAudit()}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" />
          Filter
        </div>

        <select
          value={action}
          onChange={(event) =>
            handleActionChange(
              event.target.value as AuditAction | "",
            )
          }
          className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-56"
          aria-label="Filter audit actions"
        >
          {ACTIONS.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <Activity className="h-9 w-9 text-muted-foreground" />

            <h2 className="mt-4 font-semibold">
              No audit activity
            </h2>

            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              No activity matches the selected filter.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 transition-colors hover:bg-muted/30 sm:p-5"
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Activity className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm leading-6">
                          <span className="font-semibold">
                            {getActorName(item)}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {formatAction(item.action)}
                          </span>{" "}
                          <span className="font-medium">
                            {item.entityType}
                          </span>
                        </p>

                        {item.task ? (
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            Task:{" "}
                            <span className="font-medium text-foreground">
                              {item.task.title}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(item.createdAt)}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                        <User className="h-3 w-3" />
                        {item.user?.email ||
                          "System"}
                      </span>

                      <span className="rounded-full bg-muted px-2.5 py-1">
                        {item.action}
                      </span>

                      <span className="rounded-full bg-muted px-2.5 py-1">
                        {item.entityType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && pagination ? (
          <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination.total === 0
                ? "0 results"
                : `Page ${pagination.page} of ${pagination.totalPages} · ${pagination.total} total`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1),
                  )
                }
                disabled={
                  !pagination.hasPreviousPage
                }
                className="inline-flex h-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => current + 1)
                }
                disabled={!pagination.hasNextPage}
                className="inline-flex h-9 items-center justify-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}