import { prisma } from "@/lib/db";

const commentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  },
};

export const commentRepository = {
  findById(id: string) {
    return prisma.taskComment.findUnique({
      where: { id },
      include: commentInclude,
    });
  },

  findByTask(taskId: string) {
    return prisma.taskComment.findMany({
      where: { taskId },
      include: commentInclude,
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  create(data: {
    taskId: string;
    userId: string;
    content: string;
  }) {
    return prisma.taskComment.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
        content: data.content,
      },
      include: commentInclude,
    });
  },

  update(
    id: string,
    content: string,
  ) {
    return prisma.taskComment.update({
      where: { id },
      data: { content },
      include: commentInclude,
    });
  },

  delete(id: string) {
    return prisma.taskComment.delete({
      where: { id },
    });
  },
};