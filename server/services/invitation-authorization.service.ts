import { prisma } from "@/lib/db";

type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

function canManageInvitations(
  role: OrganizationRole,
) {
  return role === "OWNER" || role === "ADMIN";
}

function canInviteRole(
  actorRole: OrganizationRole,
  invitedRole: OrganizationRole,
) {
  if (actorRole === "OWNER") {
    return true;
  }

  if (actorRole === "ADMIN") {
    return (
      invitedRole === "MEMBER" ||
      invitedRole === "VIEWER"
    );
  }

  return false;
}

export const invitationAuthorizationService = {
  async getMembership(
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
        role: true,
      },
    });
  },

  async authorizeManage(
    organizationId: string,
    userId: string,
  ) {
    const membership =
      await this.getMembership(
        organizationId,
        userId,
      );

    if (
      !membership ||
      !canManageInvitations(
        membership.role,
      )
    ) {
      throw new Error(
        "You are not authorized to manage workspace invitations.",
      );
    }

    return membership;
  },

  async authorizeInviteRole(
    organizationId: string,
    userId: string,
    invitedRole: OrganizationRole,
  ) {
    const membership =
      await this.authorizeManage(
        organizationId,
        userId,
      );

    if (
      !canInviteRole(
        membership.role,
        invitedRole,
      )
    ) {
      throw new Error(
        "Your workspace role cannot invite users with this role.",
      );
    }

    return membership;
  },

  async authorizeRevoke(
    organizationId: string,
    userId: string,
    invitationRole: OrganizationRole,
  ) {
    const membership =
      await this.authorizeManage(
        organizationId,
        userId,
      );

    if (
      membership.role === "ADMIN" &&
      invitationRole === "OWNER"
    ) {
      throw new Error(
        "Administrators cannot revoke owner invitations.",
      );
    }

    return membership;
  },
};