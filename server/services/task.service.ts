import { prisma } from "@/lib/db";

import { projectRepository } from "@/server/repositories/project.repository";
import { taskRepository } from "@/server/repositories/task.repository";

type TaskType =
  | "EPIC"
  | "STORY"
  | "TASK"
  | "BUG"
  | "SUBTASK";

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "BLOCKED";

type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

async function validateTaskRelations(data: {
  projectId: string;
  sprintId?: string | null;
  parentId?: string | null;
  assigneeId?: string | null;
}) {
  if (data.sprintId) {
    const sprint = await prisma.sprint.findFirst({
      where: {
        id: data.sprintId,
        projectId: data.projectId,
      },
      select: {
        id: true,
      },
    });

    if (!sprint) {
      throw new Error(
        "The selected sprint does not belong to this project.",
      );
    }
  }

  if (data.assigneeId) {
    const assignee =
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: data.projectId,
            userId: data.assigneeId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!assignee) {
      throw new Error(
        "The selected assignee is not a project member.",
      );
    }
  }

  if (data.parentId) {
    const parent = await taskRepository.findById(
      data.parentId,
    );

    if (
      !parent ||
      parent.projectId !== data.projectId
    ) {
      throw new Error(
        "The selected parent task does not belong to this project.",
      );
    }
  }
}

export const taskService = {
  async getTasks(data: {
    projectId: string;
    organizationId: string;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    return taskRepository.findByProject(
      data.projectId,
    );
  },

  async createTask(data: {
    projectId: string;
    organizationId: string;
    creatorId: string;
    title: string;
    description?: string;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    sprintId?: string | null;
    parentId?: string | null;
    assigneeId?: string | null;
    storyPoints?: number | null;
    dueDate?: Date | null;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    await validateTaskRelations({
      projectId: data.projectId,
      sprintId: data.sprintId,
      parentId: data.parentId,
      assigneeId: data.assigneeId,
    });

    const tasks = await taskRepository.findByProject(
      data.projectId,
    );

    const position =
      tasks.length > 0
        ? Math.max(
            ...tasks.map(
              (task) => task.position,
            ),
          ) + 1
        : 0;

    return taskRepository.create({
      projectId: data.projectId,
      creatorId: data.creatorId,
      title: data.title.trim(),
      description:
        data.description?.trim() || undefined,
      type: data.type,
      status: data.status,
      priority: data.priority,
      sprintId: data.sprintId,
      parentId: data.parentId,
      assigneeId: data.assigneeId,
      storyPoints: data.storyPoints,
      dueDate: data.dueDate,
      position,
    });
  },

  async updateTask(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    title: string;
    description?: string | null;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    sprintId?: string | null;
    parentId?: string | null;
    assigneeId?: string | null;
    storyPoints?: number | null;
    dueDate?: Date | null;
    position: number;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    const existingTask =
      await taskRepository.findByIdAndProject(
        data.taskId,
        data.projectId,
      );

    if (!existingTask) {
      throw new Error("Task not found.");
    }

    if (
      data.parentId &&
      data.parentId === data.taskId
    ) {
      throw new Error(
        "A task cannot be its own parent.",
      );
    }

    await validateTaskRelations({
      projectId: data.projectId,
      sprintId: data.sprintId,
      parentId: data.parentId,
      assigneeId: data.assigneeId,
    });

    return taskRepository.update(
      data.taskId,
      {
        title: data.title.trim(),
        description:
          data.description?.trim() || null,
        type: data.type,
        status: data.status,
        priority: data.priority,
        sprintId: data.sprintId,
        parentId: data.parentId,
        assigneeId: data.assigneeId,
        storyPoints: data.storyPoints,
        dueDate: data.dueDate,
        position: data.position,
      },
    );
  },

  async moveTask(data: {
    taskId: string;
    projectId: string;
    organizationId: string;
    status: TaskStatus;
    position: number;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    const existingTask =
      await taskRepository.findByIdAndProject(
        data.taskId,
        data.projectId,
      );

    if (!existingTask) {
      throw new Error("Task not found.");
    }

    const tasks =
      await taskRepository.findByProject(
        data.projectId,
      );

    const targetTasks = tasks
      .filter(
        (task) =>
          task.id !== data.taskId &&
          task.status === data.status,
      )
      .sort(
        (a, b) => a.position - b.position,
      );

    const boundedPosition = Math.min(
      Math.max(data.position, 0),
      targetTasks.length,
    );

    const reorderedTasks = [
      ...targetTasks.slice(0, boundedPosition),
      existingTask,
      ...targetTasks.slice(boundedPosition),
    ];

    await prisma.$transaction(
      reorderedTasks.map((task, index) =>
        prisma.task.update({
          where: {
            id: task.id,
          },
          data: {
            status:
              task.id === data.taskId
                ? data.status
                : task.status,
            position: index,
          },
        }),
      ),
    );

    return taskRepository.findByIdAndProject(
      data.taskId,
      data.projectId,
    );
  },
};