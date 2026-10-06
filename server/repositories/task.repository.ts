import { prisma } from "@/lib/db";

const taskUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
};

const taskInclude = {
  assignee: {
    select: taskUserSelect,
  },
  creator: {
    select: taskUserSelect,
  },
  sprint: true,
};

export const taskRepository = {
  findById(id: string) {
    return prisma.task.findUnique({
      where: {
        id,
      },
      include: taskInclude,
    });
  },

  findByIdAndProject(
    id: string,
    projectId: string,
  ) {
    return prisma.task.findFirst({
      where: {
        id,
        projectId,
      },
      include: taskInclude,
    });
  },

  findByProject(projectId: string) {
    return prisma.task.findMany({
      where: {
        projectId,
      },
      include: taskInclude,
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

  create(data: {
    projectId: string;
    creatorId: string;
    title: string;
    description?: string;
    type:
      | "EPIC"
      | "STORY"
      | "TASK"
      | "BUG"
      | "SUBTASK";
    status:
      | "TODO"
      | "IN_PROGRESS"
      | "IN_REVIEW"
      | "DONE"
      | "BLOCKED";
    priority:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "URGENT";
    sprintId?: string | null;
    parentId?: string | null;
    assigneeId?: string | null;
    storyPoints?: number | null;
    dueDate?: Date | null;
    position: number;
  }) {
    return prisma.task.create({
      data: {
        projectId: data.projectId,
        creatorId: data.creatorId,
        title: data.title,
        description: data.description,
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
      include: taskInclude,
    });
  },

  update(
    id: string,
    data: {
      title: string;
      description?: string | null;
      type:
        | "EPIC"
        | "STORY"
        | "TASK"
        | "BUG"
        | "SUBTASK";
      status:
        | "TODO"
        | "IN_PROGRESS"
        | "IN_REVIEW"
        | "DONE"
        | "BLOCKED";
      priority:
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "URGENT";
      sprintId?: string | null;
      parentId?: string | null;
      assigneeId?: string | null;
      storyPoints?: number | null;
      dueDate?: Date | null;
      position: number;
    },
  ) {
    return prisma.task.update({
      where: {
        id,
      },
      data: {
        title: data.title,
        description: data.description,
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
      include: taskInclude,
    });
  },
};