import { prisma } from "@/lib/db";

type CommentAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export const commentAuthorizationService = {
  async authorize(data: {
    organizationId: string;
    projectId: string;
    taskId?: string;
    commentId?: string;
    userId: string;
    action: CommentAction;
  }) {
    if (
      data.action === "CREATE" &&
      data.taskId
    ) {
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
    }

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
      throw new Error(
        "You are not a member of this workspace.",
      );
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
      data.action === "CREATE" &&
      projectMember.role === "VIEWER"
    ) {
      throw new Error(
        "You do not have permission to comment.",
      );
    }

    if (
      data.action === "UPDATE" ||
      data.action === "DELETE"
    ) {
      if (!data.commentId) {
        throw new Error(
          "Comment ID is required.",
        );
      }

      const comment =
        await prisma.taskComment.findFirst({
          where: {
            id: data.commentId,
            task: {
              projectId: data.projectId,
              project: {
                organizationId:
                  data.organizationId,
              },
            },
          },
          select: {
            userId: true,
          },
        });

      if (!comment) {
        throw new Error("Comment not found.");
      }

      if (comment.userId !== data.userId) {
        throw new Error(
          "You can only modify your own comments.",
        );
      }
    }

    return true;
  },
};