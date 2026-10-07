import { prisma } from "@/lib/db";

export const taskDeletionRepository = {
  async findTaskForDeletion(
    taskId: string,
    projectId: string,
    organizationId: string,
  ) {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
        project: {
          organizationId,
        },
      },
      select: {
        id: true,
        title: true,
        type: true,
        projectId: true,
        creatorId: true,
        parentId: true,
      },
    });
  },

  async deleteTask(taskId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.taskComment.deleteMany({
        where: {
          taskId,
        },
      });

      await tx.taskLabelAssignment.deleteMany({
        where: {
          taskId,
        },
      });

      await tx.taskAttachment.deleteMany({
        where: {
          taskId,
        },
      });

      await tx.activityLog.deleteMany({
        where: {
          taskId,
        },
      });

      await tx.task.delete({
        where: {
          id: taskId,
        },
      });
    });
  },
};