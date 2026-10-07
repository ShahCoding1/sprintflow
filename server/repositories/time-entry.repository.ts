import { prisma } from "@/lib/db";

const timeEntryUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

export const timeEntryRepository = {
  findById(entryId: string) {
    return prisma.taskTimeEntry.findUnique({
      where: { id: entryId },
      include: {
        user: {
          select: timeEntryUserSelect,
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });
  },

  findByTask(taskId: string) {
    return prisma.taskTimeEntry.findMany({
      where: { taskId },
      orderBy: { startedAt: "desc" },
      include: {
        user: {
          select: timeEntryUserSelect,
        },
      },
    });
  },

  findActiveByUser(userId: string) {
    return prisma.taskTimeEntry.findFirst({
      where: {
        userId,
        endedAt: null,
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
    });
  },

  findActiveByTaskAndUser(taskId: string, userId: string) {
    return prisma.taskTimeEntry.findFirst({
      where: {
        taskId,
        userId,
        endedAt: null,
      },
    });
  },

  create(data: {
    taskId: string;
    userId: string;
    startedAt: Date;
    endedAt?: Date | null;
    durationSeconds?: number | null;
    description?: string | null;
  }) {
    return prisma.taskTimeEntry.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
        durationSeconds: data.durationSeconds ?? null,
        description: data.description ?? null,
      },
      include: {
        user: {
          select: timeEntryUserSelect,
        },
      },
    });
  },

  update(
    entryId: string,
    data: {
      startedAt: Date;
      endedAt?: Date | null;
      durationSeconds?: number | null;
      description?: string | null;
    },
  ) {
    return prisma.taskTimeEntry.update({
      where: {
        id: entryId,
      },
      data: {
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
        durationSeconds: data.durationSeconds ?? null,
        description: data.description ?? null,
      },
      include: {
        user: {
          select: timeEntryUserSelect,
        },
      },
    });
  },

  delete(entryId: string) {
    return prisma.taskTimeEntry.delete({
      where: {
        id: entryId,
      },
    });
  },
};