import { prisma } from "@/lib/db";

export const analyticsAuthorizationService = {
  async authorizeOrganizationMember(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!membership) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    return membership;
  },

  async authorizeProject(
    userId: string,
    organizationId: string,
    projectId: string,
  ) {
    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!membership) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    const project =
      await prisma.project.findFirst({
        where: {
          id: projectId,
          organizationId,
        },
        select: {
          id: true,
          name: true,
          key: true,
        },
      });

    if (!project) {
      throw new Error("Project not found.");
    }

    return project;
  },

  async authorizeSprint(
    userId: string,
    organizationId: string,
    sprintId: string,
  ) {
    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
        select: {
          id: true,
        },
      });

    if (!membership) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    const sprint =
      await prisma.sprint.findFirst({
        where: {
          id: sprintId,
          project: {
            organizationId,
          },
        },
        select: {
          id: true,
          projectId: true,
          name: true,
        },
      });

    if (!sprint) {
      throw new Error("Sprint not found.");
    }

    return sprint;
  },
};