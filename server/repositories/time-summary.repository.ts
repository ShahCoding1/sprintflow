import { prisma } from "@/lib/db";

export type TimeSummaryEntry = {
  id: string;
  durationSeconds: number | null;
  startedAt: Date;
  endedAt: Date | null;
  userId: string;
  userName: string | null;
  userEmail: string;
  taskId: string;
  taskTitle: string;
};

export const timeSummaryRepository = {
  async findProjectEntries(
    projectId: string,
    organizationId: string,
  ): Promise<TimeSummaryEntry[]> {
    const entries = await prisma.taskTimeEntry.findMany({
      where: {
        task: {
          projectId,
          project: {
            organizationId,
          },
        },
        durationSeconds: {
          not: null,
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        durationSeconds: true,
        startedAt: true,
        endedAt: true,
        userId: true,
        taskId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      durationSeconds: entry.durationSeconds,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      userId: entry.userId,
      userName: entry.user.name,
      userEmail: entry.user.email,
      taskId: entry.taskId,
      taskTitle: entry.task.title,
    }));
  },

  async findUserEntries(
    projectId: string,
    organizationId: string,
    userId: string,
  ): Promise<TimeSummaryEntry[]> {
    const entries = await prisma.taskTimeEntry.findMany({
      where: {
        userId,
        task: {
          projectId,
          project: {
            organizationId,
          },
        },
        durationSeconds: {
          not: null,
        },
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        durationSeconds: true,
        startedAt: true,
        endedAt: true,
        userId: true,
        taskId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        task: {
          select: {
            title: true,
          },
        },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      durationSeconds: entry.durationSeconds,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      userId: entry.userId,
      userName: entry.user.name,
      userEmail: entry.user.email,
      taskId: entry.taskId,
      taskTitle: entry.task.title,
    }));
  },
};