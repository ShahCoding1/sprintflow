"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  Gauge,
  ListTodo,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";

type AnalyticsData = {
  filters: {
    projectId: string | null;
    sprintId: string | null;
  };
  projects: {
    id: string;
    name: string;
    key: string;
    status: string;
  }[];
  sprints: {
    id: string;
    projectId: string;
    name: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
  }[];
  summary: {
    totalTasks: number;
    completedTasks: number;
    remainingTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    openBugs: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    completionRate: number;
    storyPointCompletionRate: number;
    averageCycleTimeHours: number;
    averageLeadTimeHours: number;
  };
  velocity: {
    sprintId: string;
    name: string;
    status: string;
    plannedPoints: number;
    completedPoints: number;
    completedTasks: number;
    totalTasks: number;
    completionRate: number;
  }[];
  burndown: {
    sprintId: string;
    name: string;
    data: {
      date: string;
      remainingPoints: number;
      idealRemaining: number;
    }[];
  }[];
  workload: {
    userId: string;
    name: string;
    email: string;
    openTasks: number;
    storyPoints: number;
  }[];
  carryover: {
    sprintId: string;
    name: string;
    carryoverTasks: number;
    carryoverPoints: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
  }[];
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatHours(hours: number) {
  if (hours === 0) {
    return "0h";
  }

  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }

  return `${(hours / 24).toFixed(1)}d`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {label}
        </p>

        <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4" />
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function SimpleBarChart({
  values,
  max,
}: {
  values: {
    label: string;
    value: number;
    secondary?: number;
  }[];
  max: number;
}) {
  if (values.length === 0) {
    return (
      <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        No analytics data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {values.map((item) => {
        const width =
          max > 0
            ? Math.max(
                3,
                (item.value / max) * 100,
              )
            : 3;

        return (
          <div
            key={item.label}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-medium">
                {item.label}
              </span>

              <span className="shrink-0 text-muted-foreground">
                {item.value}
                {item.secondary !== undefined
                  ? ` / ${item.secondary}`
                  : ""}
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${width}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BurndownChart({
  data,
}: {
  data: {
    date: string;
    remainingPoints: number;
    idealRemaining: number;
  }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Select a sprint with start and end dates to view burndown.
      </div>
    );
  }

  const max = Math.max(
    ...data.flatMap((item) => [
      item.remainingPoints,
      item.idealRemaining,
    ]),
    1,
  );

  const width = 760;
  const height = 280;
  const padding = 32;

  const points = data.map(
    (item, index) => {
      const x =
        padding +
        (index /
          Math.max(1, data.length - 1)) *
          (width - padding * 2);

      const y =
        height -
        padding -
        (item.remainingPoints / max) *
          (height - padding * 2);

      return `${x},${y}`;
    },
  );

  const idealPoints = data.map(
    (item, index) => {
      const x =
        padding +
        (index /
          Math.max(1, data.length - 1)) *
          (width - padding * 2);

      const y =
        height -
        padding -
        (item.idealRemaining / max) *
          (height - padding * 2);

      return `${x},${y}`;
    },
  );

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[680px] w-full"
        role="img"
        aria-label="Sprint burndown chart"
      >
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="currentColor"
          strokeOpacity="0.2"
        />

        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="currentColor"
          strokeOpacity="0.2"
        />

        <polyline
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="6 5"
          points={idealPoints.join(" ")}
        />

        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          points={points.join(" ")}
        />

        {data.map((item, index) => {
          const x =
            padding +
            (index /
              Math.max(
                1,
                data.length - 1,
              )) *
              (width - padding * 2);

          const y =
            height -
            padding -
            (item.remainingPoints / max) *
              (height - padding * 2);

          return (
            <circle
              key={`${item.date}-${index}`}
              cx={x}
              cy={y}
              r="3.5"
              fill="currentColor"
            />
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span>
          {data[data.length - 1]?.date}
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [projectId, setProjectId] =
    useState("");

  const [sprintId, setSprintId] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const params =
        new URLSearchParams();

      if (projectId) {
        params.set(
          "projectId",
          projectId,
        );
      }

      if (sprintId) {
        params.set(
          "sprintId",
          sprintId,
        );
      }

      const response = await fetch(
        `/api/analytics?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to load analytics.",
        );
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load analytics.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, [projectId, sprintId]);

  const filteredSprints =
    useMemo(() => {
      if (!data) {
        return [];
      }

      if (!projectId) {
        return data.sprints;
      }

      return data.sprints.filter(
        (sprint) =>
          sprint.projectId ===
          projectId,
      );
    }, [data, projectId]);

  const velocityMax =
    Math.max(
      ...(
        data?.velocity ?? []
      ).map(
        (item) => item.plannedPoints,
      ),
      1,
    );

  const workloadMax =
    Math.max(
      ...(
        data?.workload ?? []
      ).map(
        (item) => item.openTasks,
      ),
      1,
    );

  if (loading && !data) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="font-semibold">
            Analytics unavailable
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadAnalytics()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <RefreshCw className="size-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Reports
          </p>

          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Analytics
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Real-time project and sprint metrics calculated directly from your workspace data.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={projectId}
            onChange={(event) => {
              setProjectId(
                event.target.value,
              );
              setSprintId("");
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter analytics by project"
          >
            <option value="">
              All projects
            </option>

            {data.projects.map(
              (project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.key} —{" "}
                  {project.name}
                </option>
              ),
            )}
          </select>

          <select
            value={sprintId}
            onChange={(event) =>
              setSprintId(
                event.target.value,
              )
            }
            className="h-10 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            aria-label="Filter analytics by sprint"
          >
            <option value="">
              All sprints
            </option>

            {filteredSprints.map(
              (sprint) => (
                <option
                  key={sprint.id}
                  value={sprint.id}
                >
                  {sprint.name}
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            onClick={() =>
              void loadAnalytics()
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RefreshCw
              className={`size-4 ${
                loading
                  ? "animate-spin"
                  : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ListTodo}
          label="Total Tasks"
          value={data.summary.totalTasks}
          detail={`${data.summary.remainingTasks} remaining`}
        />

        <StatCard
          icon={CheckCircle2}
          label="Completion Rate"
          value={`${data.summary.completionRate}%`}
          detail={`${data.summary.completedTasks} completed`}
        />

        <StatCard
          icon={Target}
          label="Story Points"
          value={`${data.summary.completedStoryPoints}/${data.summary.totalStoryPoints}`}
          detail={`${data.summary.storyPointCompletionRate}% completed`}
        />

        <StatCard
          icon={AlertTriangle}
          label="Open Bugs"
          value={data.summary.openBugs}
          detail={`${data.summary.blockedTasks} blocked tasks`}
        />

        <StatCard
          icon={Activity}
          label="In Progress"
          value={data.summary.inProgressTasks}
          detail="Tasks actively moving"
        />

        <StatCard
          icon={Clock3}
          label="Cycle Time"
          value={formatHours(
            data.summary
              .averageCycleTimeHours,
          )}
          detail="Average started → completed"
        />

        <StatCard
          icon={Gauge}
          label="Lead Time"
          value={formatHours(
            data.summary
              .averageLeadTimeHours,
          )}
          detail="Average created → completed"
        />

        <StatCard
          icon={Users}
          label="Workload"
          value={data.workload.length}
          detail="Members with open work"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-5" />

              <h2 className="font-semibold">
                Sprint Velocity
              </h2>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Planned versus completed story points.
            </p>
          </div>

          <SimpleBarChart
            values={data.velocity.map(
              (item) => ({
                label: item.name,
                value:
                  item.completedPoints,
                secondary:
                  item.plannedPoints,
              }),
            )}
            max={velocityMax}
          />
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="mb-5">
            <h2 className="font-semibold">
              Task Status
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current distribution across the selected scope.
            </p>
          </div>

          <SimpleBarChart
            values={data.statusDistribution.map(
              (item) => ({
                label:
                  formatStatus(
                    item.status,
                  ),
                value: item.count,
              }),
            )}
            max={Math.max(
              ...data.statusDistribution.map(
                (item) =>
                  item.count,
              ),
              1,
            )}
          />
        </section>

        <section className="rounded-xl border bg-card p-5 xl:col-span-2">
          <div className="mb-5">
            <h2 className="font-semibold">
              Sprint Burndown
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Actual remaining story points compared with the ideal trajectory.
            </p>
          </div>

          {data.burndown.map(
            (sprint) => (
              <div
                key={sprint.sprintId}
                className="mb-8 last:mb-0"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">
                    {sprint.name}
                  </h3>

                  <span className="text-xs text-muted-foreground">
                    {sprint.data.length} days
                  </span>
                </div>

                <BurndownChart
                  data={sprint.data}
                />
              </div>
            ),
          )}

          {data.burndown.length === 0 && (
            <BurndownChart data={[]} />
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="mb-5">
            <h2 className="font-semibold">
              Team Workload
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Open assigned work by team member.
            </p>
          </div>

          <SimpleBarChart
            values={data.workload.map(
              (member) => ({
                label: member.name,
                value: member.openTasks,
                secondary:
                  member.storyPoints,
              }),
            )}
            max={workloadMax}
          />

          {data.workload.length === 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No open assigned work.
            </p>
          )}
        </section>

        <section className="rounded-xl border bg-card p-5">
          <div className="mb-5">
            <h2 className="font-semibold">
              Sprint Carryover
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Work remaining at the end of each sprint.
            </p>
          </div>

          <div className="space-y-3">
            {data.carryover.length ===
              0 && (
              <p className="text-sm text-muted-foreground">
                No sprint data available.
              </p>
            )}

            {data.carryover.map(
              (item) => (
                <div
                  key={item.sprintId}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {item.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {item.carryoverTasks} tasks
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold">
                    {item.carryoverPoints} pts
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 rounded-xl border bg-card p-5">
        <h2 className="font-semibold">
          Analytics Scope
        </h2>

        <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <span className="text-muted-foreground">
              Project
            </span>

            <p className="mt-1 font-medium">
              {projectId
                ? data.projects.find(
                    (project) =>
                      project.id ===
                      projectId,
                  )?.name ??
                  "Selected project"
                : "All projects"}
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <span className="text-muted-foreground">
              Sprint
            </span>

            <p className="mt-1 font-medium">
              {sprintId
                ? data.sprints.find(
                    (sprint) =>
                      sprint.id ===
                      sprintId,
                  )?.name ??
                  "Selected sprint"
                : "All sprints"}
            </p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <span className="text-muted-foreground">
              Data Source
            </span>

            <p className="mt-1 font-medium">
              PostgreSQL / Prisma
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}