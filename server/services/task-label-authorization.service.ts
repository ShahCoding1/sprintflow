import { prisma } from "@/lib/db";

type TaskLabelAction =
  | "VIEW"
  | "ADD"
  | "REMOVE";

export const taskLabelAuthorizationService = {
  async authorize(data: {
    organizationId: string;
    projectId: string;
    taskId: string;
    userId: string;
    action: TaskLabelAction;
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
      throw new Error(
        "You are not a member of this workspace.",
      );
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
      throw new Error("Task not found.");
    }

    if (data.action === "VIEW") {
      return true;
    }

    if (
      membership.role === "OWNER" ||
      membership.role === "ADMIN"
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
      throw new Error(
        "You are not a member of this project.",
      );
    }

    if (
      projectMember.role === "MANAGER" ||
      projectMember.role === "MEMBER"
    ) {
      return true;
    }

    throw new Error(
      "You do not have permission to manage task labels.",
    );
  },
};