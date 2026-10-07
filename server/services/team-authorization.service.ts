import { prisma } from "@/lib/db";

import { teamRepository } from "@/server/repositories/team.repository";

type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

export const teamAuthorizationService = {
  async getOrganizationMembership(
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
          organizationId: true,
          userId: true,
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

  async authorizeView(
    userId: string,
    organizationId: string,
  ) {
    return this.getOrganizationMembership(
      userId,
      organizationId,
    );
  },

  async authorizeManagement(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await this.getOrganizationMembership(
        userId,
        organizationId,
      );

    if (
      membership.role !== "OWNER" &&
      membership.role !== "ADMIN"
    ) {
      throw new Error(
        "Only workspace owners and administrators can manage teams.",
      );
    }

    return membership;
  },

  async authorizeTeam(
    userId: string,
    organizationId: string,
    teamId: string,
  ) {
    const membership =
      await this.authorizeView(
        userId,
        organizationId,
      );

    const team =
      await teamRepository.findById(
        teamId,
        organizationId,
      );

    if (!team) {
      throw new Error("Team not found.");
    }

    return {
      membership,
      team,
    };
  },

  async authorizeTeamManagement(
    userId: string,
    organizationId: string,
    teamId: string,
  ) {
    const membership =
      await this.authorizeManagement(
        userId,
        organizationId,
      );

    const team =
      await teamRepository.findById(
        teamId,
        organizationId,
      );

    if (!team) {
      throw new Error("Team not found.");
    }

    return {
      membership,
      team,
    };
  },

  async authorizeMemberMutation(
    userId: string,
    organizationId: string,
    teamId: string,
    targetUserId: string,
  ) {
    const membership =
      await this.authorizeTeamManagement(
        userId,
        organizationId,
        teamId,
      );

    const target =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: targetUserId,
          },
        },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      });

    if (!target) {
      throw new Error(
        "The selected user is not a member of this workspace.",
      );
    }

    return {
      membership,
      target,
    };
  },

  getRoleLabel(
    role: OrganizationRole,
  ) {
    return role;
  },
};