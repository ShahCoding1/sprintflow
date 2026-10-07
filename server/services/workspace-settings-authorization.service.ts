import { workspaceSettingsRepository } from "@/server/repositories/workspace-settings.repository";

type WorkspaceRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

const managementRoles: WorkspaceRole[] = [
  "OWNER",
  "ADMIN",
];

export const workspaceSettingsAuthorizationService = {
  async getMembership(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await workspaceSettingsRepository.findMember(
        organizationId,
        userId,
      );

    if (!membership) {
      throw new Error("You are not a member of this workspace.");
    }

    return membership;
  },

  async authorizeWorkspaceAccess(
    userId: string,
    organizationId: string,
  ) {
    return this.getMembership(
      userId,
      organizationId,
    );
  },

  async authorizeManagement(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await this.getMembership(
        userId,
        organizationId,
      );

    if (
      !managementRoles.includes(
        membership.role,
      )
    ) {
      throw new Error(
        "Only workspace owners and administrators can manage workspace settings.",
      );
    }

    return membership;
  },

  async authorizeOwner(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await this.getMembership(
        userId,
        organizationId,
      );

    if (membership.role !== "OWNER") {
      throw new Error(
        "Only the workspace owner can perform this action.",
      );
    }

    return membership;
  },

  async authorizeMemberMutation(
    actorId: string,
    organizationId: string,
    targetUserId: string,
    nextRole?: WorkspaceRole,
  ) {
    const actor =
      await this.authorizeManagement(
        actorId,
        organizationId,
      );

    const target =
      await workspaceSettingsRepository.findMember(
        organizationId,
        targetUserId,
      );

    if (!target) {
      throw new Error("Workspace member not found.");
    }

    if (actorId === targetUserId) {
      throw new Error(
        "You cannot modify your own workspace membership from this screen.",
      );
    }

    if (target.role === "OWNER") {
      throw new Error(
        "The workspace owner cannot be modified from this screen.",
      );
    }

    if (
      nextRole === "OWNER" &&
      actor.role !== "OWNER"
    ) {
      throw new Error(
        "Only the workspace owner can assign the owner role.",
      );
    }

    return {
      actor,
      target,
    };
  },

  async authorizeMemberRemoval(
    actorId: string,
    organizationId: string,
    targetUserId: string,
  ) {
    return this.authorizeMemberMutation(
      actorId,
      organizationId,
      targetUserId,
    );
  },
};