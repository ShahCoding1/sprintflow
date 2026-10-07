import { prisma } from "@/lib/db";

type SprintMutationAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export const sprintAuthorizationService = {
  async authorize(data: {
    organizationId: string;
    projectId: string;
    userId: string;
    action: SprintMutationAction;
  }) {
    const project =
      await prisma.project.findFirst({
        where: {
          id: data.projectId,
          organizationId: data.organizationId,
        },
        select: {
          id: true,
        },
      });

    if (!project) {
      throw new Error("Project not found.");
    }

    const organizationMember =
      await prisma.organizationMember.findUnique({
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
      });

    if (!organizationMember) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    if (
      organizationMember.role === "OWNER" ||
      organizationMember.role === "ADMIN"
    ) {
      return true;
    }

    const projectMember =
      await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: data.projectId,
            userId: data.userId,
          },
        },
        select: {
          role: true,
        },
      });

    if (!projectMember) {
      throw new Error(
        "You are not a member of this project.",
      );
    }

    if (projectMember.role === "MANAGER") {
      return true;
    }

    throw new Error(
      "You do not have permission to manage sprints.",
    );
  },
};