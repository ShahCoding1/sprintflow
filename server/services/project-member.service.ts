import { projectMemberAuthorizationService } from "@/server/services/project-member-authorization.service";
import { projectMemberRepository } from "@/server/repositories/project-member.repository";

type ProjectMemberRole =
  | "MANAGER"
  | "MEMBER"
  | "VIEWER";

const PROJECT_MANAGER_ROLES: ProjectMemberRole[] = [
  "MANAGER",
];

export const projectMemberService = {
  async getProjectMembers(data: {
    projectId: string;
    organizationId: string;
  }) {
    await projectMemberAuthorizationService.authorizeProjectAccess(
      data,
    );

    return projectMemberRepository.findManyByProject(
      data.projectId,
    );
  },

  async addProjectMember(data: {
    projectId: string;
    organizationId: string;
    actorUserId: string;
    userId: string;
    role: ProjectMemberRole;
  }) {
    await projectMemberAuthorizationService.authorizeProjectMemberManagement(
      {
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.actorUserId,
      },
    );

    await projectMemberAuthorizationService.authorizeTargetUser(
      data.organizationId,
      data.userId,
    );

    const existingMember =
      await projectMemberRepository.findByProjectAndUser(
        data.projectId,
        data.userId,
      );

    if (existingMember) {
      throw new Error(
        "This user is already a member of the project.",
      );
    }

    try {
      return await projectMemberRepository.create({
        projectId: data.projectId,
        userId: data.userId,
        role: data.role,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        throw new Error(
          "This user is already a member of the project.",
        );
      }

      throw error;
    }
  },

  async updateProjectMemberRole(data: {
    projectId: string;
    organizationId: string;
    actorUserId: string;
    userId: string;
    role: ProjectMemberRole;
  }) {
    await projectMemberAuthorizationService.authorizeProjectMemberManagement(
      {
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.actorUserId,
      },
    );

    const existingMember =
      await projectMemberRepository.findByProjectAndUser(
        data.projectId,
        data.userId,
      );

    if (!existingMember) {
      throw new Error(
        "Project member not found.",
      );
    }

    if (
      existingMember.role === "MANAGER" &&
      data.role !== "MANAGER"
    ) {
      const members =
        await projectMemberRepository.findManyByProject(
          data.projectId,
        );

      const managerCount = members.filter(
        (member) =>
          member.role === "MANAGER",
      ).length;

      if (managerCount <= 1) {
        throw new Error(
          "The project must have at least one manager.",
        );
      }
    }

    return projectMemberRepository.updateRole(
      data.projectId,
      data.userId,
      data.role,
    );
  },

  async removeProjectMember(data: {
    projectId: string;
    organizationId: string;
    actorUserId: string;
    userId: string;
  }) {
    await projectMemberAuthorizationService.authorizeProjectMemberManagement(
      {
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.actorUserId,
      },
    );

    const existingMember =
      await projectMemberRepository.findByProjectAndUser(
        data.projectId,
        data.userId,
      );

    if (!existingMember) {
      throw new Error(
        "Project member not found.",
      );
    }

    if (
      PROJECT_MANAGER_ROLES.includes(
        existingMember.role,
      )
    ) {
      const members =
        await projectMemberRepository.findManyByProject(
          data.projectId,
        );

      const managerCount = members.filter(
        (member) =>
          member.role === "MANAGER",
      ).length;

      if (managerCount <= 1) {
        throw new Error(
          "The project must have at least one manager.",
        );
      }
    }

    await projectMemberRepository.delete(
      data.projectId,
      data.userId,
    );

    return {
      success: true,
    };
  },
};