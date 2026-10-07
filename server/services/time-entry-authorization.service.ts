import { prisma } from "@/lib/db";

export const timeEntryAuthorizationService = {
  async authorizeTaskAccess(
    organizationId: string,
    projectId: string,
    taskId: string,
    userId: string,
  ) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new Error("WORKSPACE_MEMBERSHIP_REQUIRED");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new Error("PROJECT_NOT_FOUND");
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      throw new Error("TASK_NOT_FOUND");
    }

    if (membership.role === "VIEWER") {
      throw new Error("FORBIDDEN");
    }

    return membership;
  },

  async authorizeEntryAccess(
    organizationId: string,
    entryId: string,
    userId: string,
  ) {
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new Error("WORKSPACE_MEMBERSHIP_REQUIRED");
    }

    const entry = await prisma.taskTimeEntry.findFirst({
      where: {
        id: entryId,
        task: {
          project: {
            organizationId,
          },
        },
      },
      select: {
        id: true,
        userId: true,
        taskId: true,
        startedAt: true,
        endedAt: true,
        description: true,
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (!entry) {
      throw new Error("TIME_ENTRY_NOT_FOUND");
    }

    const canManageAnyEntry =
      membership.role === "OWNER" ||
      membership.role === "ADMIN";

    if (!canManageAnyEntry && entry.userId !== userId) {
      throw new Error("FORBIDDEN");
    }

    return {
      membership,
      entry,
    };
  },
};