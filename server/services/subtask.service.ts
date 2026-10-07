import { prisma } from "@/lib/db";

import {
  type CreateSubtaskInput,
  type UpdateSubtaskInput,
} from "@/features/task/schemas/subtask.schema";

import { subtaskRepository } from "@/server/repositories/subtask.repository";

export const subtaskService = {
  async getSubtasks(data: {
    parentId: string;
    projectId: string;
    organizationId: string;
  }) {
    const parentTask = await prisma.task.findFirst({
      where: {
        id: data.parentId,
        projectId: data.projectId,
        project: {
          organizationId: data.organizationId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!parentTask) {
      throw new Error("Parent task not found.");
    }

    return subtaskRepository.findByParentTask(
      data.parentId,
    );
  },

  async createSubtask(data: {
    parentId: string;
    projectId: string;
    organizationId: string;
    creatorId: string;
    input: CreateSubtaskInput;
  }) {
    const parentTask = await prisma.task.findFirst({
      where: {
        id: data.parentId,
        projectId: data.projectId,
        project: {
          organizationId: data.organizationId,
        },
      },
      select: {
        id: true,
        type: true,
      },
    });

    if (!parentTask) {
      throw new Error("Parent task not found.");
    }

    if (parentTask.type === "SUBTASK") {
      throw new Error(
        "A subtask cannot contain another subtask.",
      );
    }

    if (data.input.assigneeId) {
      const projectMember =
        await prisma.projectMember.findFirst({
          where: {
            projectId: data.projectId,
            userId: data.input.assigneeId,
          },
          select: {
            id: true,
          },
        });

      if (!projectMember) {
        throw new Error(
          "Assignee must be a member of the project.",
        );
      }
    }

    const positionResult =
      await subtaskRepository.findNextPosition(
        data.parentId,
      );

    const position =
      (positionResult._max.position ?? -1) + 1;

    return subtaskRepository.create({
      projectId: data.projectId,
      parentId: data.parentId,
      creatorId: data.creatorId,
      assigneeId: data.input.assigneeId ?? null,
      title: data.input.title,
      description: data.input.description ?? null,
      priority: data.input.priority,
      storyPoints: data.input.storyPoints ?? null,
      dueDate: data.input.dueDate ?? null,
      position,
    });
  },

  async updateSubtask(data: {
    subtaskId: string;
    projectId: string;
    organizationId: string;
    input: UpdateSubtaskInput;
  }) {
    const subtask =
      await subtaskRepository.findById(
        data.subtaskId,
      );

    if (
      !subtask ||
      subtask.type !== "SUBTASK" ||
      subtask.projectId !== data.projectId
    ) {
      throw new Error("Subtask not found.");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        organizationId: data.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    if (data.input.assigneeId) {
      const projectMember =
        await prisma.projectMember.findFirst({
          where: {
            projectId: data.projectId,
            userId: data.input.assigneeId,
          },
          select: {
            id: true,
          },
        });

      if (!projectMember) {
        throw new Error(
          "Assignee must be a member of the project.",
        );
      }
    }

    return subtaskRepository.update(
      data.subtaskId,
      {
        title: data.input.title,
        description:
          data.input.description ?? null,
        status: data.input.status,
        priority: data.input.priority,
        assigneeId:
          data.input.assigneeId ?? null,
        storyPoints:
          data.input.storyPoints ?? null,
        dueDate: data.input.dueDate ?? null,
        position: data.input.position,
      },
    );
  },

  async deleteSubtask(data: {
    subtaskId: string;
    projectId: string;
    organizationId: string;
  }) {
    const subtask =
      await subtaskRepository.findById(
        data.subtaskId,
      );

    if (
      !subtask ||
      subtask.type !== "SUBTASK" ||
      subtask.projectId !== data.projectId
    ) {
      throw new Error("Subtask not found.");
    }

    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        organizationId: data.organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new Error("Project not found.");
    }

    await subtaskRepository.delete(
      data.subtaskId,
    );
  },
};