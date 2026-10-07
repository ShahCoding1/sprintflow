import { prisma } from "@/lib/db";

const subtaskUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

const subtaskInclude = {
  assignee: {
    select: subtaskUserSelect,
  },
  creator: {
    select: subtaskUserSelect,
  },
};

export const subtaskRepository = {
  findByParentTask(parentId: string) {
    return prisma.task.findMany({
      where: {
        parentId,
        type: "SUBTASK",
      },
      include: subtaskInclude,
      orderBy: [
        {
          position: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });
  },

  findById(id: string) {
    return prisma.task.findUnique({
      where: {
        id,
      },
      include: subtaskInclude,
    });
  },

  findNextPosition(parentId: string) {
    return prisma.task.aggregate({
      where: {
        parentId,
        type: "SUBTASK",
      },
      _max: {
        position: true,
      },
    });
  },

  create(data: {
    projectId: string;
    parentId: string;
    creatorId: string;
    assigneeId?: string | null;
    title: string;
    description?: string | null;
    priority:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT";
    storyPoints?: number | null;
    dueDate?: Date | null;
    position: number;
  }) {
    return prisma.task.create({
      data: {
        projectId: data.projectId,
        parentId: data.parentId,
        creatorId: data.creatorId,
        assigneeId: data.assigneeId ?? null,

        title: data.title,
        description: data.description ?? null,

        type: "SUBTASK",
        status: "TODO",
        priority: data.priority,

        storyPoints: data.storyPoints ?? null,
        dueDate: data.dueDate ?? null,

        position: data.position,
      },
      include: subtaskInclude,
    });
  },

  update(
    id: string,
    data: {
      title?: string;
      description?: string | null;
      status?:
        | "TODO"
        | "IN_PROGRESS"
        | "IN_REVIEW"
        | "DONE"
        | "BLOCKED";
      priority?:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "URGENT";
      assigneeId?: string | null;
      storyPoints?: number | null;
      dueDate?: Date | null;
      position?: number;
    },
  ) {
    return prisma.task.update({
      where: {
        id,
      },
      data,
      include: subtaskInclude,
    });
  },

  delete(id: string) {
    return prisma.task.delete({
      where: {
        id,
      },
    });
  },
};