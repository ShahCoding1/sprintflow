import { prisma } from "@/lib/db";

export const projectSummaryService = {
  async getProjectSummary(data: {
    projectId: string;
    organizationId: string;
  }) {
    const project =
      await prisma.project.findFirst({
        where: {
          id: data.projectId,
          organizationId: data.organizationId,
        },
        select: {
          id: true,
          _count: {
            select: {
              tasks: true,
              members: true,
              sprints: true,
            },
          },
        },
      });

    if (!project) {
      throw new Error("Project not found.");
    }

    return {
      taskCount: project._count.tasks,
      memberCount: project._count.members,
      sprintCount: project._count.sprints,
    };
  },
};