import { prisma } from "@/lib/db";

type MutationAction =
  | "CREATE"
  | "UPDATE"
  | "MOVE"
  | "DELETE";

type AuthorizationInput = {
  organizationId: string;
  projectId: string;
  userId: string;
  action: MutationAction;
};

const projectManagerRoles = [
  "MANAGER",
] as const;

const organizationAdminRoles = [
  "OWNER",
  "ADMIN",
] as const;

export const taskAuthorizationService = {
  async authorize(
    data: AuthorizationInput,
  ) {
    const project =
      await prisma.project.findFirst({
        where: {
          id: data.projectId,
          organizationId:
            data.organizationId,
        },
        select: {
          id: true,
          organizationId: true,
        },
      });

    if (!project) {
      throw new Error(
        "Project not found.",
      );
    }

    const organizationMember =
      await prisma.organizationMember.findUnique(
        {
          where: {
            organizationId_userId: {
              organizationId:
                data.organizationId,
              userId: data.userId,
            },
          },
          select: {
            role: true,
          },
        },
      );

    if (!organizationMember) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    const projectMember =
      await prisma.projectMember.findUnique(
        {
          where: {
            projectId_userId: {
              projectId: data.projectId,
              userId: data.userId,
            },
          },
          select: {
            role: true,
          },
        },
      );

    const isOrganizationAdmin =
      organizationAdminRoles.includes(
        organizationMember.role as
          (typeof organizationAdminRoles)[number],
      );

    const isProjectManager =
      projectMember
        ? projectManagerRoles.includes(
            projectMember.role as
              (typeof projectManagerRoles)[number],
          )
        : false;

    if (
      isOrganizationAdmin ||
      isProjectManager
    ) {
      return true;
    }

    if (
      data.action === "CREATE" ||
      data.action === "UPDATE" ||
      data.action === "MOVE"
    ) {
      if (
        projectMember?.role ===
        "MEMBER"
      ) {
        return true;
      }
    }

    throw new Error(
      "You do not have permission to perform this action.",
    );
  },
};