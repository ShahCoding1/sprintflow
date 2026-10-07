import { prisma } from "@/lib/db";

export const taskLabelRepository = {
  findByTask(taskId: string) {
    return prisma.taskLabelAssignment.findMany({
      where: {
        taskId,
      },
      include: {
        label: true,
      },
      orderBy: {
        label: {
          name: "asc",
        },
      },
    });
  },

  findAssignment(taskId: string, labelId: string) {
    return prisma.taskLabelAssignment.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });
  },

  create(taskId: string, labelId: string) {
    return prisma.taskLabelAssignment.create({
      data: {
        taskId,
        labelId,
      },
      include: {
        label: true,
      },
    });
  },

  delete(taskId: string, labelId: string) {
    return prisma.taskLabelAssignment.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });
  },
};