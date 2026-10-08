import { prisma } from "@/lib/db";

type AttachmentAction =
  | "VIEW"
  | "UPLOAD"
  | "DELETE";

const privilegedRoles = new Set([
  "OWNER",
  "ADMIN",
]);

export const taskAttachmentAuthorizationService = {
  async authorizeTaskAccess(data: {
    userId: string;
    organizationId: string;
    projectId: string;
    taskId: string;
    action: AttachmentAction;
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

    if (
      membership.role === "VIEWER" &&
      (data.action === "UPLOAD" ||
        data.action === "DELETE")
    ) {
      return false;
    }

    return true;
  },

  async authorizeAttachmentAccess(data: {
    userId: string;
    organizationId: string;
    attachmentId: string;
    action: "VIEW" | "DELETE";
  }) {
    const attachment =
      await prisma.taskAttachment.findFirst({
        where: {
          id: data.attachmentId,
          task: {
            project: {
              organizationId: data.organizationId,
            },
          },
        },
        select: {
          id: true,
          userId: true,
          task: {
            select: {
              projectId: true,
            },
          },
        },
      });

    if (!attachment) {
      return {
        authorized: false,
        attachment: null,
        role: null,
      };
    }

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
      return {
        authorized: false,
        attachment: null,
        role: null,
      };
    }

    if (
      data.action === "VIEW" &&
      membership.role === "VIEWER"
    ) {
      return {
        authorized: true,
        attachment,
        role: membership.role,
      };
    }

    if (data.action === "VIEW") {
      return {
        authorized: true,
        attachment,
        role: membership.role,
      };
    }

    const canDelete =
      attachment.userId === data.userId ||
      privilegedRoles.has(membership.role);

    return {
      authorized: canDelete,
      attachment,
      role: membership.role,
    };
  },
};