import { prisma } from "@/lib/db";

type AuditFilters = {
  organizationId: string;
  action?: string;
  entityType?: string;
  userId?: string;
};

export const auditRepository = {
  async findMany(
    filters: AuditFilters,
    skip: number,
    take: number,
  ) {
    const where = {
      organizationId: filters.organizationId,
      ...(filters.action
        ? { action: filters.action as never }
        : {}),
      ...(filters.entityType
        ? { entityType: filters.entityType }
        : {}),
      ...(filters.userId
        ? { userId: filters.userId }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
        select: {
          id: true,
          organizationId: true,
          userId: true,
          taskId: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),

      prisma.activityLog.count({
        where,
      }),
    ]);

    return {
      items,
      total,
    };
  },
};