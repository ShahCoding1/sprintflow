import {
  analyticsRepository,
} from "@/server/repositories/analytics.repository";

type AnalyticsServiceInput = {
  organizationId: string;
  projectId?: string;
  sprintId?: string;
};

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function hoursBetween(
  start: Date,
  end: Date,
) {
  return (
    (end.getTime() - start.getTime()) /
    (1000 * 60 * 60)
  );
}

function daysBetween(
  start: Date,
  end: Date,
) {
  return (
    (end.getTime() - start.getTime()) /
    (1000 * 60 * 60 * 24)
  );
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const value = new Date(date);

  value.setUTCHours(0, 0, 0, 0);

  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);

  value.setUTCHours(23, 59, 59, 999);

  return value;
}

export const analyticsService = {
  async getAnalytics(
    data: AnalyticsServiceInput,
  ) {
    const [
      projects,
      sprints,
      tasks,
      members,
    ] = await Promise.all([
      analyticsRepository.getProjects(
        data.organizationId,
      ),
      analyticsRepository.getSprintsForAnalytics(
        data.organizationId,
        data.projectId,
      ),
      analyticsRepository.getTasks(
        data.organizationId,
        data.projectId,
        data.sprintId,
      ),
      analyticsRepository.getMembers(
        data.organizationId,
      ),
    ]);

    const scopedSprints = data.sprintId
      ? sprints.filter(
          (sprint) => sprint.id === data.sprintId,
        )
      : sprints;

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) => task.status === "DONE",
    ).length;

    const remainingTasks =
      totalTasks - completedTasks;

    const blockedTasks = tasks.filter(
      (task) => task.status === "BLOCKED",
    ).length;

    const inProgressTasks = tasks.filter(
      (task) =>
        task.status === "IN_PROGRESS" ||
        task.status === "IN_REVIEW",
    ).length;

    const totalStoryPoints = tasks.reduce(
      (sum, task) =>
        sum + (task.storyPoints ?? 0),
      0,
    );

    const completedStoryPoints =
      tasks.reduce(
        (sum, task) =>
          sum +
          (task.status === "DONE"
            ? task.storyPoints ?? 0
            : 0),
        0,
      );

    const completionRate =
      totalTasks === 0
        ? 0
        : round(
            (completedTasks / totalTasks) *
              100,
          );

    const storyPointCompletionRate =
      totalStoryPoints === 0
        ? 0
        : round(
            (completedStoryPoints /
              totalStoryPoints) *
              100,
          );

    const openBugs = tasks.filter(
      (task) =>
        task.type === "BUG" &&
        task.status !== "DONE",
    ).length;

    const cycleTimeTasks = tasks.filter(
      (task) =>
        task.startedAt &&
        task.completedAt,
    );

    const leadTimeTasks = tasks.filter(
      (task) => task.completedAt,
    );

    const averageCycleTimeHours =
      cycleTimeTasks.length === 0
        ? 0
        : round(
            cycleTimeTasks.reduce(
              (sum, task) =>
                sum +
                hoursBetween(
                  task.startedAt!,
                  task.completedAt!,
                ),
              0,
            ) / cycleTimeTasks.length,
          );

    const averageLeadTimeHours =
      leadTimeTasks.length === 0
        ? 0
        : round(
            leadTimeTasks.reduce(
              (sum, task) =>
                sum +
                hoursBetween(
                  task.createdAt,
                  task.completedAt!,
                ),
              0,
            ) / leadTimeTasks.length,
          );

    const velocity = scopedSprints.map(
      (sprint) => {
        const sprintTasks = tasks.filter(
          (task) =>
            task.sprintId === sprint.id,
        );

        const plannedPoints =
          sprintTasks.reduce(
            (sum, task) =>
              sum + (task.storyPoints ?? 0),
            0,
          );

        const completedPoints =
          sprintTasks.reduce(
            (sum, task) =>
              sum +
              (task.status === "DONE"
                ? task.storyPoints ?? 0
                : 0),
            0,
          );

        const sprintCompletedTasks =
          sprintTasks.filter(
            (task) =>
              task.status === "DONE",
          ).length;

        return {
          sprintId: sprint.id,
          name: sprint.name,
          status: sprint.status,
          plannedPoints,
          completedPoints,
          completedTasks:
            sprintCompletedTasks,
          totalTasks: sprintTasks.length,
          completionRate:
            sprintTasks.length === 0
              ? 0
              : round(
                  (sprintCompletedTasks /
                    sprintTasks.length) *
                    100,
                ),
        };
      },
    );

    const burndown = scopedSprints
      .filter(
        (sprint) =>
          sprint.startDate &&
          sprint.endDate,
      )
      .map((sprint) => {
        const sprintTasks = tasks.filter(
          (task) =>
            task.sprintId === sprint.id,
        );

        const plannedPoints =
          sprintTasks.reduce(
            (sum, task) =>
              sum + (task.storyPoints ?? 0),
            0,
          );

        const start = startOfDay(
          sprint.startDate!,
        );

        const end = startOfDay(
          sprint.endDate!,
        );

        const totalDays = Math.max(
          1,
          Math.ceil(daysBetween(start, end)),
        );

        const pointsPerDay =
          plannedPoints / totalDays;

        const dataPoints = [];

        for (
          let index = 0;
          index <= totalDays;
          index += 1
        ) {
          const currentDate = new Date(start);

          currentDate.setUTCDate(
            currentDate.getUTCDate() +
              index,
          );

          const completedByDay =
            sprintTasks
              .filter(
                (task) =>
                  task.completedAt &&
                  endOfDay(
                    task.completedAt,
                  ) <= endOfDay(
                    currentDate,
                  ),
              )
              .reduce(
                (sum, task) =>
                  sum +
                  (task.storyPoints ?? 0),
                0,
              );

          const remainingPoints =
            Math.max(
              0,
              plannedPoints -
                completedByDay,
            );

          const idealRemaining = Math.max(
            0,
            plannedPoints -
              pointsPerDay * index,
          );

          dataPoints.push({
            date: formatDate(
              currentDate,
            ),
            remainingPoints,
            idealRemaining: round(
              idealRemaining,
            ),
          });
        }

        return {
          sprintId: sprint.id,
          name: sprint.name,
          data: dataPoints,
        };
      });

    const workload = members
      .map((member) => {
        const memberTasks = tasks.filter(
          (task) =>
            task.assigneeId === member.id &&
            task.status !== "DONE",
        );

        const storyPoints =
          memberTasks.reduce(
            (sum, task) =>
              sum + (task.storyPoints ?? 0),
            0,
          );

        return {
          userId: member.id,
          name:
            member.name ??
            member.email,
          email: member.email,
          openTasks: memberTasks.length,
          storyPoints,
        };
      })
      .filter(
        (member) =>
          member.openTasks > 0,
      )
      .sort(
        (a, b) =>
          b.openTasks - a.openTasks,
      );

    const carryover = scopedSprints.map(
      (sprint) => {
        const sprintTasks = tasks.filter(
          (task) =>
            task.sprintId === sprint.id,
        );

        const incompleteTasks =
          sprintTasks.filter(
            (task) =>
              task.status !== "DONE",
          );

        return {
          sprintId: sprint.id,
          name: sprint.name,
          carryoverTasks:
            incompleteTasks.length,
          carryoverPoints:
            incompleteTasks.reduce(
              (sum, task) =>
                sum +
                (task.storyPoints ?? 0),
              0,
            ),
        };
      },
    );

    const statusDistribution = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
      "BLOCKED",
    ].map((status) => ({
      status,
      count: tasks.filter(
        (task) => task.status === status,
      ).length,
    }));

    return {
      filters: {
        projectId:
          data.projectId ?? null,
        sprintId:
          data.sprintId ?? null,
      },

      projects,

      sprints: scopedSprints.map(
        (sprint) => ({
          id: sprint.id,
          projectId: sprint.projectId,
          name: sprint.name,
          status: sprint.status,
          startDate:
            sprint.startDate,
          endDate:
            sprint.endDate,
        }),
      ),

      summary: {
        totalTasks,
        completedTasks,
        remainingTasks,
        inProgressTasks,
        blockedTasks,
        openBugs,
        totalStoryPoints,
        completedStoryPoints,
        completionRate,
        storyPointCompletionRate,
        averageCycleTimeHours,
        averageLeadTimeHours,
      },

      velocity,
      burndown,
      workload,
      carryover,
      statusDistribution,
    };
  },
};