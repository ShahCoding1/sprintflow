import { invitationRepository } from "@/server/repositories/invitation.repository";

type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

const MANAGEMENT_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
];

export const invitationAuthorizationService = {
  async canManage(
    organizationId: string,
    userId: string,
  ) {
    const member =
      await invitationRepository.findOrganizationMember(
        organizationId,
        userId,
      );

    if (!member) {
      return false;
    }

    return MANAGEMENT_ROLES.includes(member.role);
  },

  async authorizeManage(
    organizationId: string,
    userId: string,
  ) {
    const member =
      await invitationRepository.findOrganizationMember(
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
};