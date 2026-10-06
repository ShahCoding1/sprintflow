import { organizationRepository } from "@/server/repositories/organization.repository";
import { projectMemberRepository } from "@/server/repositories/project-member.repository";
import { projectRepository } from "@/server/repositories/project.repository";

type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

type ProjectRole =
  | "MANAGER"
  | "MEMBER"
  | "VIEWER";

const ORGANIZATION_MANAGER_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
];

const PROJECT_MANAGER_ROLES: ProjectRole[] = [
  "MANAGER",
];

export const projectMemberAuthorizationService = {
  async authorizeProjectAccess(data: {
    projectId: string;
    organizationId: string;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    return project;
  },

  async authorizeProjectMemberManagement(data: {
    projectId: string;
    organizationId: string;
    userId: string;
  }) {
    const membership =
      await organizationRepository.findMembershipByUserAndOrganization(
        data.userId,
        data.organizationId,
      );

    if (!membership) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    if (
      ORGANIZATION_MANAGER_ROLES.includes(
        membership.role,
      )
    ) {
      return {
        project,
        organizationRole: membership.role,
        projectRole: null,
      };
    }

    const projectMembership =
      await projectMemberRepository.findByProjectAndUser(
        data.projectId,
        data.userId,
      );

    if (
      projectMembership &&
      PROJECT_MANAGER_ROLES.includes(
        projectMembership.role,
      )
    ) {
      return {
        project,
        organizationRole: membership.role,
        projectRole: projectMembership.role,
      };
    }

    throw new Error(
      "You do not have permission to manage project members.",
    );
  },

  async authorizeTargetUser(
    organizationId: string,
    targetUserId: string,
  ) {
    const membership =
      await organizationRepository.findMembershipByUserAndOrganization(
        targetUserId,
        organizationId,
      );

    if (!membership) {
      throw new Error(
        "The selected user is not a member of this workspace.",
      );
    }

    return membership;
  },
};