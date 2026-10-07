import { prisma } from "@/lib/db";

export const workspaceSettingsRepository = {
  findWorkspaceById(organizationId: string) {
    return prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            projects: true,
            teams: true,
          },
        },
      },
    });
  },

  findWorkspaceBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });
  },

  updateWorkspace(
    organizationId: string,
    data: {
      name: string;
      slug: string;
      description: string | null;
    },
  ) {
    return prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            members: true,
            projects: true,
            teams: true,
          },
        },
      },
    });
  },

  findMember(
    organizationId: string,
    userId: string,
  ) {
    return prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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

  findMembers(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      orderBy: [
        {
          role: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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

  countOwners(organizationId: string) {
    return prisma.organizationMember.count({
      where: {
        organizationId,
        role: "OWNER",
      },
    });
  },

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
  ) {
    return prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: {
        role,
      },
      select: {
        id: true,
        organizationId: true,
        userId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
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
    organizationId: string,
    userId: string,
  ) {
    return prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    });
  },
};