import { prisma } from "@/lib/db";

const attachmentUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

export const taskAttachmentRepository = {
  findById(attachmentId: string) {
    return prisma.taskAttachment.findUnique({
      where: {
        id: attachmentId,
      },
      include: {
        user: {
          select: attachmentUserSelect,
        },
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: {
              select: {
                id: true,
                organizationId: true,
              },
            },
          },
        },
      },
    });
  },

  findByTask(taskId: string) {
    return prisma.taskAttachment.findMany({
      where: {
        taskId,
      },
      include: {
        user: {
          select: attachmentUserSelect,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  create(data: {
    taskId: string;
    userId: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    return prisma.taskAttachment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        fileName: data.fileName,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
      },
      include: {
        user: {
          select: attachmentUserSelect,
        },
      },
    });
  },

  delete(attachmentId: string) {
    return prisma.taskAttachment.delete({
      where: {
        id: attachmentId,
      },
    });
  },
};