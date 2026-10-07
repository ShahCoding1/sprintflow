import { prisma } from "@/lib/db";

import { activityRepository } from "@/server/repositories/activity.repository";

export const activityService = {
  async getTaskActivity(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    limit: number;
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

    return activityRepository.findByTask(
      data.taskId,
      data.limit,
    );
  },

  async createTaskActivity(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    userId?: string | null;
    action:
      | "CREATED"
      | "UPDATED"
      | "DELETED"
      | "ASSIGNED"
      | "UNASSIGNED"
      | "STATUS_CHANGED"
      | "PRIORITY_CHANGED"
      | "COMMENTED"
      | "MOVED"
      | "ADDED"
      | "REMOVED";
    entityType: string;
    metadata?: object | null;
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

    return activityRepository.create({
      organizationId: data.organizationId,
      userId: data.userId,
      taskId: data.taskId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.taskId,
      metadata: data.metadata,
    });
  },
};