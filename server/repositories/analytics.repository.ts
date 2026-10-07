import { prisma } from "@/lib/db";

const taskSelect = {
  id: true,
  projectId: true,
  sprintId: true,
  assigneeId: true,
  type: true,
  status: true,
  storyPoints: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
};

const sprintSelect = {
  id: true,
  projectId: true,
  name: true,
  status: true,
  startDate: true,
  endDate: true,
  completedAt: true,
};

export const analyticsRepository = {
  async getProjects(organizationId: string) {
    return prisma.project.findMany({
      where: {
        organizationId,
      },
      select: {
        id: true,
        name: true,
        key: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  async getSprints(
    organizationId: string,
    projectId?: string,
  ) {
    return prisma.sprint.findMany({
      where: {
        ...(projectId
          ? {
              projectId,
            }
          : {
              project: {
                organizationId,
              },
            }),
      },
      select: sprintSelect,
      orderBy: [
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 50,
    });
  },

  async getTasks(
    organizationId: string,
    projectId?: string,
    sprintId?: string,
  ) {
    return prisma.task.findMany({
      where: {
        ...(projectId
          ? {
              projectId,
            }
          : {
              project: {
                organizationId,
              },
            }),
        ...(sprintId
          ? {
              sprintId,
            }
          : {}),
      },
      select: taskSelect,
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async getSprintsForAnalytics(
    organizationId: string,
    projectId?: string,
  ) {
    return prisma.sprint.findMany({
      where: {
        ...(projectId
          ? {
              projectId,
            }
          : {
              project: {
                organizationId,
              },
            }),
      },
      select: sprintSelect,
      orderBy: {
        startDate: "asc",
      },
      take: 20,
    });
  },

  async getMembers(
    organizationId: string,
  ) {
    return prisma.user.findMany({
      where: {
        organizationMemberships: {
          some: {
            organizationId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  },
};