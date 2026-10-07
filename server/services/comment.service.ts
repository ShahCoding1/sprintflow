import { prisma } from "@/lib/db";

import { commentRepository } from "@/server/repositories/comment.repository";

export const commentService = {
  async getComments(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
  }) {
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

    return commentRepository.findByTask(data.taskId);
  },

  async createComment(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    userId: string;
    content: string;
  }) {
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

    return commentRepository.create({
      taskId: data.taskId,
      userId: data.userId,
      content: data.content.trim(),
    });
  },

  async updateComment(data: {
    commentId: string;
    userId: string;
    content: string;
  }) {
    const comment = await commentRepository.findById(
      data.commentId,
    );

    if (!comment) {
      throw new Error("Comment not found.");
    }

    if (comment.userId !== data.userId) {
      throw new Error(
        "You can only edit your own comments.",
      );
    }

    return commentRepository.update(
      data.commentId,
      data.content.trim(),
    );
  },

  async deleteComment(data: {
    commentId: string;
    userId: string;
  }) {
    const comment = await commentRepository.findById(
      data.commentId,
    );

    if (!comment) {
      throw new Error("Comment not found.");
    }

    if (comment.userId !== data.userId) {
      throw new Error(
        "You can only delete your own comments.",
      );
    }

    return commentRepository.delete(
      data.commentId,
    );
  },
};