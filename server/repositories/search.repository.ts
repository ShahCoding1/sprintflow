import { prisma } from "@/lib/db";

export const searchRepository = {
  async searchProjects(data: {
    organizationId: string;
    query: string;
    limit: number;
  }) {
    return prisma.project.findMany({
      where: {
        organizationId: data.organizationId,
        OR: [
          {
            name: {
              contains: data.query,
              mode: "insensitive",
            },
          },
          {
            key: {
              contains: data.query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: data.query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        key: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
      take: data.limit,
    });
  },

  async searchTasks(data: {
    organizationId: string;
    query: string;
    limit: number;
  }) {
    return prisma.task.findMany({
      where: {
        project: {
          organizationId: data.organizationId,
        },
        OR: [
          {
            title: {
              contains: data.query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: data.query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        project: {
          select: {
            name: true,
            key: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: data.limit,
    });
  },

  async searchSprints(data: {
    organizationId: string;
    query: string;
    limit: number;
  }) {
    return prisma.sprint.findMany({
      where: {
        project: {
          organizationId: data.organizationId,
        },
        OR: [
          {
            name: {
              contains: data.query,
              mode: "insensitive",
            },
          },
          {
            goal: {
              contains: data.query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        projectId: true,
        project: {
          select: {
            name: true,
            key: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: data.limit,
    });
  },

  async searchMembers(data: {
    organizationId: string;
    query: string;
    limit: number;
  }) {
    return prisma.user.findMany({
      where: {
        organizationMemberships: {
          some: {
            organizationId: data.organizationId,
          },
        },
        OR: [
          {
            name: {
              contains: data.query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: data.query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
      orderBy: {
        name: "asc",
      },
      take: data.limit,
    });
  },
};