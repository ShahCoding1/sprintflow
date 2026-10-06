import { prisma } from "@/lib/db";

const sprintInclude = {
  _count: {
    select: {
      tasks: true,
    },
  },
};

export const sprintRepository = {
  findById(id: string) {
    return prisma.sprint.findUnique({
      where: { id },
      include: sprintInclude,
    });
  },

  findByIdAndProject(
    id: string,
    projectId: string,
  ) {
    return prisma.sprint.findFirst({
      where: {
        id,
        projectId,
      },
      include: sprintInclude,
    });
  },

  findByProject(projectId: string) {
    return prisma.sprint.findMany({
      where: {
        projectId,
      },
      include: sprintInclude,
      orderBy: [
        {
          status: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
  },

  create(data: {
    projectId: string;
    name: string;
    goal?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    return prisma.sprint.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        goal: data.goal,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: sprintInclude,
    });
  },

  update(
    id: string,
    data: {
      name: string;
      goal?: string | null;
      status:
        | "PLANNED"
        | "ACTIVE"
        | "COMPLETED";
      startDate?: Date | null;
      endDate?: Date | null;
    },
  ) {
    return prisma.sprint.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        goal: data.goal,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: sprintInclude,
    });
  },

  delete(id: string) {
    return prisma.sprint.delete({
      where: {
        id,
      },
    });
  },
};