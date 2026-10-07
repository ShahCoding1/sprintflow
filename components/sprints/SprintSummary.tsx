"use client";

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Loader2,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

type SprintSummaryProps = {
  projectId: string;
  sprintId: string;
};

type SprintSummaryData = {
  sprint: {
    id: string;
    name: string;
    goal: string | null;
    status:
      | "PLANNED"
      | "ACTIVE"
      | "COMPLETED";
    startDate: string | null;
    endDate: string | null;
  };
  totals: {
    tasks: number;
    completedTasks: number;
    remainingTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    storyPoints: number;
    completedStoryPoints: number;
  };
  progress: {
    taskCompletionPercentage: number;
    storyPointCompletionPercentage: number;
  };
};

type SummaryResponse = {
  success: boolean;
  summary?: SprintSummaryData;
  message?: string;
};

type SprintSummaryState = {
  summary: SprintSummaryData | null;
  error: string | null;
};

async function fetchSprintSummary(
  projectId: string,
  sprintId: string,
): Promise<SprintSummaryData> {
  const response = await fetch(
    `/api/projects/${projectId}/sprints/${sprintId}/summary`,
    {
      cache: "no-store",
    },
  );

  const result =
    (await response.json()) as SummaryResponse;

  if (
    !response.ok ||
    !result.success ||
    !result.summary
  ) {
    throw new Error(
      result.message ??
        "Unable to load sprint summary.",
    );
  }

  return result.summary;
}

export default function SprintSummary({
  projectId,
  sprintId,
}: SprintSummaryProps) {
  const [state, setState] =
    useState<SprintSummaryState>({
      summary: null,
      error: null,
    });

  const [loading, setLoading] =
    useState(false);

  async function handleLoad() {
    try {
      setLoading(true);
      setState({
        summary: null,
        error: null,
      });

      const summary =
        await fetchSprintSummary(
          projectId,
          sprintId,
        );

      setState({
        summary,
        error: null,
      });
    } catch (error) {
      console.error(
        "Load sprint summary error:",
        error,
      );

      setState({
        summary: null,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load sprint summary.",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center rounded-xl border bg-muted/20 px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading sprint progress...
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{state.error}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleLoad();
          }}
          className="mt-2 text-xs font-medium underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!state.summary) {
    return (
      <div className="mt-4 flex items-center justify-between rounded-xl border bg-muted/20 px-4 py-4">
        <div>
          <p className="text-sm font-medium">
            Sprint Progress
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Load the latest sprint metrics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleLoad();
          }}
          className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs font-medium transition hover:bg-muted"
        >
          <BarChart3 className="size-3.5" />
          Load summary
        </button>
      </div>
    );
  }

  const {
    totals,
    progress,
  } = state.summary;

  return (
    <div className="mt-4 rounded-xl border bg-muted/20 p-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />

            <h4 className="text-sm font-semibold">
              Sprint Progress
            </h4>
          </div>

          <span className="text-sm font-semibold">
            {progress.taskCompletionPercentage}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${progress.taskCompletionPercentage}%`,
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CircleDot className="size-4" />
              <span className="text-xs">
                Tasks
              </span>
            </div>

            <p className="mt-2 text-lg font-semibold">
              {totals.tasks}
            </p>
          </div>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4" />
              <span className="text-xs">
                Done
              </span>
            </div>

            <p className="mt-2 text-lg font-semibold">
              {totals.completedTasks}
            </p>
          </div>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="size-4" />
              <span className="text-xs">
                In Progress
              </span>
            </div>

            <p className="mt-2 text-lg font-semibold">
              {totals.inProgressTasks}
            </p>
          </div>

          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="size-4" />
              <span className="text-xs">
                Points
              </span>
            </div>

            <p className="mt-2 text-lg font-semibold">
              {totals.completedStoryPoints}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                / {totals.storyPoints}
              </span>
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
          <div>
            Remaining:{" "}
            <span className="font-medium text-foreground">
              {totals.remainingTasks}
            </span>
          </div>

          <div>
            Blocked:{" "}
            <span className="font-medium text-foreground">
              {totals.blockedTasks}
            </span>
          </div>

          <div>
            Story points:{" "}
            <span className="font-medium text-foreground">
              {
                progress.storyPointCompletionPercentage
              }
              % complete
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void handleLoad();
          }}
          className="self-start text-xs font-medium text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
        >
          Refresh summary
        </button>
      </div>
    </div>
  );
}