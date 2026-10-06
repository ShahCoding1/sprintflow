import { prisma } from "@/lib/db";

export const projectMemberRepository = {
  findByProjectAndUser(
    projectId: string,
    userId: string,
  ) {
    return prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      include: {
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

  findManyByProject(projectId: string) {
    return prisma.projectMember.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  create(data: {
    projectId: string;
    userId: string;
    role:
      | "MANAGER"
      | "MEMBER"
      | "VIEWER";
  }) {
    return prisma.projectMember.create({
      data: {
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
      },
      include: {
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

  updateRole(
    projectId: string,
    userId: string,
    role:
      | "MANAGER"
      | "MEMBER"
      | "VIEWER",
  ) {
    return prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      data: {
        role,
      },
      include: {
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

  delete(
    projectId: string,
    userId: string,
  ) {
    return prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });
  },
};