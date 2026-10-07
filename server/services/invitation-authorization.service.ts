import { invitationRepository } from "@/server/repositories/invitation.repository";

export type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

const MANAGEMENT_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
];

export const invitationAuthorizationService = {
  async canManage(organizationId: string, userId: string) {
    const member = await invitationRepository.findOrganizationMember(
      organizationId,
      userId,
    );

    if (!member) {
      return false;
    }

    return MANAGEMENT_ROLES.includes(member.role);
  },

  async authorizeManage(organizationId: string, userId: string) {
    const member = await invitationRepository.findOrganizationMember(
      organizationId,
      userId,
    );

    if (!member) {
      throw new Error("WORKSPACE_MEMBERSHIP_REQUIRED");
    }

    if (!MANAGEMENT_ROLES.includes(member.role)) {
      throw new Error("INVITATION_MANAGEMENT_FORBIDDEN");
    }

    return member;
  },

  canAssignRole(
    actorRole: OrganizationRole,
    targetRole: OrganizationRole,
  ) {
    if (actorRole === "OWNER") {
      return true;
    }

    if (actorRole === "ADMIN") {
      return targetRole !== "OWNER";
    }

    return false;
  },

  authorizeRoleAssignment(
    actorRole: OrganizationRole,
    targetRole: OrganizationRole,
  ) {
    if (!this.canAssignRole(actorRole, targetRole)) {
      throw new Error("INVITATION_ROLE_ASSIGNMENT_FORBIDDEN");
    }
  },
};