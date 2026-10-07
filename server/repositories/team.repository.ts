import { prisma } from "@/lib/db";

export const teamRepository = {
  findByOrganization(organizationId: string) {
    return prisma.team.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  },

  findById(
    teamId: string,
    organizationId: string,
  ) {
    return prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  },

  findByName(
    organizationId: string,
    name: string,
  ) {
    return prisma.team.findFirst({
      where: {
        organizationId,
        name,
      },
      select: {
        id: true,
      },
    });
  },

  create(data: {
    organizationId: string;
    name: string;
    description: string | null;
  }) {
    return prisma.team.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        description: data.description,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  },

  async update(
    teamId: string,
    organizationId: string,
    data: {
      name: string;
      description: string | null;
    },
  ) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      throw new Error("TEAM_NOT_FOUND");
    }

    return prisma.team.update({
      where: {
        id: team.id,
      },
      data: {
        name: data.name,
        description: data.description,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  },

  async delete(
    teamId: string,
    organizationId: string,
  ) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      throw new Error("TEAM_NOT_FOUND");
    }

    return prisma.team.delete({
      where: {
        id: team.id,
      },
      select: {
        id: true,
        name: true,
        organizationId: true,
      },
    });
  },

  findMember(
    teamId: string,
    userId: string,
  ) {
    return prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: {
        id: true,
        teamId: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  },

  findMembers(teamId: string) {
    return prisma.teamMember.findMany({
      where: {
        teamId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        teamId: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  },

  createMember(
    teamId: string,
    userId: string,
  ) {
    return prisma.teamMember.create({
      data: {
        teamId,
        userId,
      },
      select: {
        id: true,
        teamId: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });
  },

  deleteMember(
    teamId: string,
    userId: string,
  ) {
    return prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: {
        id: true,
        teamId: true,
        userId: true,
      },
    });
  },
};