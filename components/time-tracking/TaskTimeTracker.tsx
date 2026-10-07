"use client";

import {
  Check,
  Clock3,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  Square,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type TimeEntryUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type TimeEntry = {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  user: TimeEntryUser;
};

type ActiveTimer = {
  id: string;
  taskId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  description: string | null;
  task: {
    id: string;
    title: string;
    projectId: string;
  };
};

type TimeEntriesResponse = {
  entries?: TimeEntry[];
  error?: string;
};

type ActiveTimerResponse = {
  entry?: ActiveTimer | null;
  error?: string;
};

type EntryResponse = {
  entry?: TimeEntry;
  error?: string;
};

type TaskTimeTrackerProps = {
  projectId: string;
  taskId: string;
  currentUserId: string;
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(
    0,
    Math.floor(totalSeconds),
  );

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor(
    (safeSeconds % 3600) / 60,
  );
  const seconds = safeSeconds % 60;

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");
  const hours = String(
    date.getHours(),
  ).padStart(2, "0");
  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getCurrentDateTimeLocal() {
  const now = new Date();

  now.setSeconds(0, 0);

  return toDateTimeLocal(now.toISOString());
}

function getDurationSeconds(entry: TimeEntry) {
  if (entry.durationSeconds !== null) {
    return entry.durationSeconds;
  }

  if (!entry.endedAt) {
    return Math.max(
      0,
      Math.floor(
        (Date.now() -
          new Date(entry.startedAt).getTime()) /
          1000,
      ),
    );
  }

  return Math.max(
    0,
    Math.floor(
      (new Date(entry.endedAt).getTime() -
        new Date(entry.startedAt).getTime()) /
        1000,
    ),
  );
}

export default function TaskTimeTracker({
  projectId,
  taskId,
  currentUserId,
}: TaskTimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(
    [],
  );

  const [activeTimer, setActiveTimer] =
    useState<ActiveTimer | null>(null);

  const [clockTick, setClockTick] = useState(
    () => Date.now(),
  );

  const [description, setDescription] =
    useState("");

  const [manualStart, setManualStart] =
    useState(getCurrentDateTimeLocal);

  const [manualEnd, setManualEnd] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [savingManual, setSavingManual] =
    useState(false);
  const [savingEdit, setSavingEdit] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [editingEntry, setEditingEntry] =
    useState<TimeEntry | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const activeTimerBelongsToTask =
    activeTimer?.taskId === taskId;

  const activeTimerBelongsToAnotherTask =
    activeTimer !== null &&
    activeTimer.taskId !== taskId;

  const elapsedSeconds = useMemo(() => {
    if (
      !activeTimerBelongsToTask ||
      !activeTimer
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.floor(
        (clockTick -
          new Date(
            activeTimer.startedAt,
          ).getTime()) /
          1000,
      ),
    );
  }, [
    activeTimer,
    activeTimerBelongsToTask,
    clockTick,
  ]);

  const totalTrackedSeconds = useMemo(() => {
    return entries.reduce(
      (total, entry) =>
        total + getDurationSeconds(entry),
      0,
    );
  }, [entries]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  const loadTimeData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      clearMessages();

      try {
        const [
          entriesResponse,
          activeResponse,
        ] = await Promise.all([
          fetch(
            `/api/projects/${projectId}/tasks/${taskId}/time`,
            {
              cache: "no-store",
            },
          ),
          fetch("/api/time/active", {
            cache: "no-store",
          }),
        ]);

        const entriesResult =
          (await entriesResponse.json()) as TimeEntriesResponse;

        const activeResult =
          (await activeResponse.json()) as ActiveTimerResponse;

        if (!entriesResponse.ok) {
          throw new Error(
            entriesResult.error ??
              "Unable to load time entries.",
          );
        }

        if (!activeResponse.ok) {
          throw new Error(
            activeResult.error ??
              "Unable to load active timer.",
          );
        }

        setEntries(entriesResult.entries ?? []);
        setActiveTimer(
          activeResult.entry ?? null,
        );
      } catch (loadError) {
        console.error(
          "Load time tracking data error:",
          loadError,
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load time tracking data.",
        );
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [
      clearMessages,
      projectId,
      taskId,
    ],
  );

  /*
   * The initial data load is intentionally deferred by
   * one task tick. This keeps the effect focused on
   * scheduling the external request and avoids React's
   * set-state-in-effect cascading-render warning.
   */
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTimeData();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadTimeData]);

  /*
   * Keep the timer display alive while a timer is
   * running. The state update happens from the interval
   * callback rather than synchronously inside the effect.
   */
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockTick(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const startTimer = async () => {
    clearMessages();
    setStarting(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startedAt: new Date().toISOString(),
            description:
              description.trim() || null,
          }),
        },
      );

      const result =
        (await response.json()) as EntryResponse;

      if (!response.ok || !result.entry) {
        throw new Error(
          result.error ??
            "Unable to start timer.",
        );
      }

      setDescription("");

      setSuccessMessage(
        "Timer started successfully.",
      );

      await loadTimeData(false);
    } catch (startError) {
      console.error(
        "Start timer error:",
        startError,
      );

      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start timer.",
      );
    } finally {
      setStarting(false);
    }
  };

  const stopTimer = async () => {
    if (
      !activeTimer ||
      !activeTimerBelongsToTask
    ) {
      return;
    }

    clearMessages();
    setStopping(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/time/${activeTimer.id}/stop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        },
      );

      const result =
        (await response.json()) as EntryResponse;

      if (!response.ok || !result.entry) {
        throw new Error(
          result.error ??
            "Unable to stop timer.",
        );
      }

      setSuccessMessage(
        "Timer stopped successfully.",
      );

      await loadTimeData(false);
    } catch (stopError) {
      console.error(
        "Stop timer error:",
        stopError,
      );

      setError(
        stopError instanceof Error
          ? stopError.message
          : "Unable to stop timer.",
      );
    } finally {
      setStopping(false);
    }
  };

  const createManualEntry = async () => {
    clearMessages();

    if (!manualStart || !manualEnd) {
      setError(
        "Please provide both start and end times.",
      );
      return;
    }

    const startedAt = new Date(manualStart);
    const endedAt = new Date(manualEnd);

    if (
      Number.isNaN(startedAt.getTime()) ||
      Number.isNaN(endedAt.getTime())
    ) {
      setError("Please provide valid dates.");
      return;
    }

    if (endedAt <= startedAt) {
      setError(
        "End time must be after start time.",
      );
      return;
    }

    setSavingManual(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/time`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startedAt: startedAt.toISOString(),
            endedAt: endedAt.toISOString(),
            description:
              description.trim() || null,
          }),
        },
      );

      const result =
        (await response.json()) as EntryResponse;

      if (!response.ok || !result.entry) {
        throw new Error(
          result.error ??
            "Unable to create manual time entry.",
        );
      }

      setDescription("");
      setManualEnd("");

      setSuccessMessage(
        "Manual time entry added.",
      );

      await loadTimeData(false);
    } catch (manualError) {
      console.error(
        "Create manual time entry error:",
        manualError,
      );

      setError(
        manualError instanceof Error
          ? manualError.message
          : "Unable to create manual time entry.",
      );
    } finally {
      setSavingManual(false);
    }
  };

  const updateEntry = async () => {
    if (!editingEntry) {
      return;
    }

    clearMessages();

    const startedAt = new Date(
      editingEntry.startedAt,
    );

    const endedAt = editingEntry.endedAt
      ? new Date(editingEntry.endedAt)
      : null;

    if (
      Number.isNaN(startedAt.getTime()) ||
      (endedAt &&
        Number.isNaN(endedAt.getTime()))
    ) {
      setError("Please provide valid dates.");
      return;
    }

    if (endedAt && endedAt <= startedAt) {
      setError(
        "End time must be after start time.",
      );
      return;
    }

    setSavingEdit(true);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/time/${editingEntry.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startedAt: startedAt.toISOString(),
            endedAt: endedAt
              ? endedAt.toISOString()
              : null,
            description:
              editingEntry.description?.trim() ||
              null,
          }),
        },
      );

      const result =
        (await response.json()) as EntryResponse;

      if (!response.ok || !result.entry) {
        throw new Error(
          result.error ??
            "Unable to update time entry.",
        );
      }

      setEditingEntry(null);

      setSuccessMessage(
        "Time entry updated successfully.",
      );

      await loadTimeData(false);
    } catch (updateError) {
      console.error(
        "Update time entry error:",
        updateError,
      );

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update time entry.",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteEntry = async (
    entryId: string,
  ) => {
    clearMessages();

    const confirmed = window.confirm(
      "Delete this time entry? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(entryId);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/time/${entryId}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to delete time entry.",
        );
      }

      setSuccessMessage(
        "Time entry deleted successfully.",
      );

      await loadTimeData(false);
    } catch (deleteError) {
      console.error(
        "Delete time entry error:",
        deleteError,
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete time entry.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const updateEditingField = (
    field:
      | "startedAt"
      | "endedAt"
      | "description",
    value: string,
  ) => {
    if (!editingEntry) {
      return;
    }

    setEditingEntry({
      ...editingEntry,
      [field]:
        field === "description"
          ? value
          : value
            ? new Date(value).toISOString()
            : null,
    });
  };

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="size-5 text-primary" />

            <h2 className="text-lg font-semibold">
              Time Tracking
            </h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Track the time spent working on this task.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadTimeData(false);
          }}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Refresh
        </button>
      </div>

      {(error || successMessage) && (
        <div className="mt-5 space-y-2">
          {error && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <span>{error}</span>

              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() => setError(null)}
                className="shrink-0 rounded p-1 hover:bg-destructive/10"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
            >
              <span>{successMessage}</span>

              <button
                type="button"
                aria-label="Dismiss success message"
                onClick={() =>
                  setSuccessMessage(null)
                }
                className="shrink-0 rounded p-1 hover:bg-primary/10"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-xl border bg-background p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current timer
              </p>

              <p className="mt-2 font-mono text-3xl font-semibold tracking-tight">
                {activeTimerBelongsToTask
                  ? formatDuration(
                      elapsedSeconds,
                    )
                  : "00:00:00"}
              </p>

              {activeTimerBelongsToTask &&
                activeTimer && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Started{" "}
                    {formatDateTime(
                      activeTimer.startedAt,
                    )}
                  </p>
                )}

              {activeTimerBelongsToAnotherTask &&
                activeTimer && (
                  <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    A timer is already running on
                    another task.
                  </p>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTimerBelongsToTask ? (
                <button
                  type="button"
                  onClick={() => {
                    void stopTimer();
                  }}
                  disabled={stopping}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {stopping ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  {stopping
                    ? "Stopping..."
                    : "Stop Timer"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    void startTimer();
                  }}
                  disabled={
                    starting ||
                    activeTimerBelongsToAnotherTask
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {starting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {starting
                    ? "Starting..."
                    : "Start Timer"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label
              htmlFor="time-description"
              className="text-sm font-medium"
            >
              Description
            </label>

            <input
              id="time-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={1000}
              placeholder="What are you working on?"
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {description.length}/1000 characters
          </p>
        </div>

        <div className="rounded-xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total tracked time
          </p>

          <p className="mt-2 font-mono text-2xl font-semibold">
            {formatDuration(
              totalTrackedSeconds,
            )}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Across {entries.length} completed
            {entries.length === 1
              ? " entry"
              : " entries"}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-background p-5">
        <div>
          <h3 className="font-semibold">
            Add manual time
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Record time that was tracked outside
            the live timer.
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="manual-start"
              className="text-sm font-medium"
            >
              Start
            </label>

            <input
              id="manual-start"
              type="datetime-local"
              value={manualStart}
              onChange={(event) =>
                setManualStart(
                  event.target.value,
                )
              }
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label
              htmlFor="manual-end"
              className="text-sm font-medium"
            >
              End
            </label>

            <input
              id="manual-end"
              type="datetime-local"
              value={manualEnd}
              onChange={(event) =>
                setManualEnd(
                  event.target.value,
                )
              }
              className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void createManualEntry();
            }}
            disabled={savingManual}
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingManual && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Add Manual Entry
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">
              Time history
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              All recorded time entries for this
              task.
            </p>
          </div>

          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {entries.length}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center justify-center rounded-xl border bg-background px-4 py-10">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed bg-background px-5 py-10 text-center">
            <Clock3 className="mx-auto size-8 text-muted-foreground/60" />

            <p className="mt-3 text-sm font-medium">
              No time entries yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Start a timer or add manual time to
              begin tracking this task.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {entries.map((entry) => {
              const duration =
                getDurationSeconds(entry);

              const isOwnEntry =
                entry.userId === currentUserId;

              const isRunning =
                entry.endedAt === null;

              return (
                <article
                  key={entry.id}
                  className="rounded-xl border bg-background p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-semibold">
                          {formatDuration(
                            duration,
                          )}
                        </span>

                        {isRunning && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            Running
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(
                          entry.startedAt,
                        )}
                        {" → "}
                        {entry.endedAt
                          ? formatDateTime(
                              entry.endedAt,
                            )
                          : "Running"}
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {entry.description ||
                          "No description"}
                      </p>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {entry.user.name ||
                          entry.user.email}
                      </p>
                    </div>

                    {isOwnEntry && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingEntry(
                              entry,
                            )
                          }
                          disabled={isRunning}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Pencil className="size-4" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void deleteEntry(
                              entry.id,
                            );
                          }}
                          disabled={
                            deletingId ===
                              entry.id ||
                            isRunning
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingId ===
                          entry.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {editingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setEditingEntry(null);
              setError(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-time-entry-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3
                  id="edit-time-entry-title"
                  className="font-semibold"
                >
                  Edit Time Entry
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Update the recorded start,
                  end, or description.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close edit time entry"
                onClick={() =>
                  setEditingEntry(null)
                }
                disabled={savingEdit}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label
                  htmlFor="edit-time-start"
                  className="text-sm font-medium"
                >
                  Start
                </label>

                <input
                  id="edit-time-start"
                  type="datetime-local"
                  value={toDateTimeLocal(
                    editingEntry.startedAt,
                  )}
                  onChange={(event) =>
                    updateEditingField(
                      "startedAt",
                      event.target.value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-time-end"
                  className="text-sm font-medium"
                >
                  End
                </label>

                <input
                  id="edit-time-end"
                  type="datetime-local"
                  value={
                    editingEntry.endedAt
                      ? toDateTimeLocal(
                          editingEntry.endedAt,
                        )
                      : ""
                  }
                  onChange={(event) =>
                    updateEditingField(
                      "endedAt",
                      event.target.value,
                    )
                  }
                  className="mt-2 h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-time-description"
                  className="text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="edit-time-description"
                  value={
                    editingEntry.description ??
                    ""
                  }
                  onChange={(event) =>
                    updateEditingField(
                      "description",
                      event.target.value,
                    )
                  }
                  maxLength={1000}
                  rows={4}
                  className="mt-2 w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setEditingEntry(null)
                }
                disabled={savingEdit}
                className="rounded-lg border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void updateEntry();
                }}
                disabled={savingEdit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingEdit ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {savingEdit
                  ? "Saving..."
                  : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}