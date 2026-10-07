import { prisma } from "@/lib/db";

export const taskDeletionAuthorizationService = {
  async authorize(data: {
    userId: string;
    organizationId: string;
    projectId: string;
    taskId: string;
  }) {
    const organizationMember =
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

    if (!organizationMember) {
      return false;
    }

    if (
      organizationMember.role === "OWNER" ||
      organizationMember.role === "ADMIN"
    ) {
      return true;
    }

    const projectMember =
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: data.projectId,
            userId: data.userId,
          },
        },
        select: {
          role: true,
        },
      });

    if (!projectMember) {
      return false;
    }

    return projectMember.role === "MANAGER";
  },
};