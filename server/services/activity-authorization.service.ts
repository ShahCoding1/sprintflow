import { prisma } from "@/lib/db";

type ActivityAction = "VIEW";

export const activityAuthorizationService = {
  async authorize(data: {
    userId: string;
    organizationId: string;
    projectId: string;
    taskId: string;
    action: ActivityAction;
  }) {
    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: data.organizationId,
            userId: data.userId,
          },
        },
        select: {
          role: true,
        },
      });

    if (!membership) {
      return false;
    }

    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        projectId: data.projectId,
        project: {
          organizationId: data.organizationId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!task) {
      return false;
    }

    return true;
  },
};