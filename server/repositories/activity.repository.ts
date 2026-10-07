import { prisma } from "@/lib/db";

const activityUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

export const activityRepository = {
  findByTask(taskId: string, limit: number) {
    return prisma.activityLog.findMany({
      where: {
        taskId,
      },
      include: {
        user: {
          select: activityUserSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });
  },

  create(data: {
    organizationId: string;
    userId?: string | null;
    taskId?: string | null;
    action:
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
    entityType: string;
    entityId: string;
    metadata?: object | null;
  }) {
    return prisma.activityLog.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId ?? null,
        taskId: data.taskId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        metadata: data.metadata ?? undefined,
      },
      include: {
        user: {
          select: activityUserSelect,
        },
      },
    });
  },
};