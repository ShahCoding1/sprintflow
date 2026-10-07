import { prisma } from "@/lib/db";
import { taskLabelRepository } from "@/server/repositories/task-label.repository";

export const taskLabelService = {
  async getTaskLabels(data: {
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

    return taskLabelRepository.findByTask(data.taskId);
  },

  async addLabel(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    labelId: string;
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

    const label = await prisma.taskLabel.findFirst({
      where: {
        id: data.labelId,
        organizationId: data.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!label) {
      throw new Error("Label not found.");
    }

    const existing =
      await taskLabelRepository.findAssignment(
        data.taskId,
        data.labelId,
      );

    if (existing) {
      throw new Error(
        "This label is already assigned to the task.",
      );
    }

    return taskLabelRepository.create(
      data.taskId,
      data.labelId,
    );
  },

  async removeLabel(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    labelId: string;
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

    const label = await prisma.taskLabel.findFirst({
      where: {
        id: data.labelId,
        organizationId: data.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!label) {
      throw new Error("Label not found.");
    }

    const existing =
      await taskLabelRepository.findAssignment(
        data.taskId,
        data.labelId,
      );

    if (!existing) {
      throw new Error(
        "This label is not assigned to the task.",
      );
    }

    await taskLabelRepository.delete(
      data.taskId,
      data.labelId,
    );
  },
};