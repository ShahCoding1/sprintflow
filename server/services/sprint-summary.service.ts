import { prisma } from "@/lib/db";

export const sprintSummaryService = {
  async getSprintSummary(data: {
    sprintId: string;
    projectId: string;
    organizationId: string;
  }) {
    const project =
      await prisma.project.findFirst({
        where: {
          id: data.projectId,
          organizationId:
            data.organizationId,
        },
        select: {
          id: true,
        },
      });

    if (!project) {
      throw new Error(
        "Project not found.",
      );
    }

    const sprint =
      await prisma.sprint.findFirst({
        where: {
          id: data.sprintId,
          projectId: data.projectId,
        },
        select: {
          id: true,
          name: true,
          goal: true,
          status: true,
          startDate: true,
          endDate: true,
        },
      });

    if (!sprint) {
      throw new Error(
        "Sprint not found.",
      );
    }

    const tasks =
      await prisma.task.findMany({
        where: {
          projectId: data.projectId,
          sprintId: data.sprintId,
        },
        select: {
          status: true,
          storyPoints: true,
        },
      });

    const totalTasks = tasks.length;

    const completedTasks =
      tasks.filter(
        (task) =>
          task.status === "DONE",
      ).length;

    const inProgressTasks =
      tasks.filter(
        (task) =>
          task.status ===
            "IN_PROGRESS" ||
          task.status ===
            "IN_REVIEW",
      ).length;

    const blockedTasks =
      tasks.filter(
        (task) =>
          task.status === "BLOCKED",
      ).length;

    const remainingTasks =
      totalTasks -
      completedTasks;

    const totalStoryPoints =
      tasks.reduce(
        (total, task) =>
          total +
          (task.storyPoints ?? 0),
        0,
      );

    const completedStoryPoints =
      tasks
        .filter(
          (task) =>
            task.status ===
            "DONE",
        )
        .reduce(
          (total, task) =>
            total +
            (task.storyPoints ?? 0),
          0,
        );

    const completionPercentage =
      totalTasks === 0
        ? 0
        : Math.round(
            (completedTasks /
              totalTasks) *
              100,
          );

    const storyPointCompletionPercentage =
      totalStoryPoints === 0
        ? 0
        : Math.round(
            (completedStoryPoints /
              totalStoryPoints) *
              100,
          );

    return {
      sprint,
      totals: {
        tasks: totalTasks,
        completedTasks,
        remainingTasks,
        inProgressTasks,
        blockedTasks,
        storyPoints:
          totalStoryPoints,
        completedStoryPoints,
      },
      progress: {
        taskCompletionPercentage:
          completionPercentage,
        storyPointCompletionPercentage:
          storyPointCompletionPercentage,
      },
    };
  },
};