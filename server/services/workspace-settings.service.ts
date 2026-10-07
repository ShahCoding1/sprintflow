import { workspaceSettingsRepository } from "@/server/repositories/workspace-settings.repository";
import { workspaceSettingsAuthorizationService } from "@/server/services/workspace-settings-authorization.service";
import { auditEventService } from "@/server/services/audit-event.service";

type WorkspaceRole =
  | "OWNER"
  | "ADMIN"
  | "MEMBER"
  | "VIEWER";

export const workspaceSettingsService = {
  async getWorkspace(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await workspaceSettingsAuthorizationService.authorizeWorkspaceAccess(
        userId,
        organizationId,
      );

    const workspace =
      await workspaceSettingsRepository.findWorkspaceById(
        organizationId,
      );

    if (!workspace) {
      throw new Error("Workspace not found.");
    }

    return {
      workspace,
      role: membership.role,
    };
  },

  async updateWorkspace(data: {
    userId: string;
    organizationId: string;
    name: string;
    slug: string;
    description?: string | null;
  }) {
    await workspaceSettingsAuthorizationService.authorizeManagement(
      data.userId,
      data.organizationId,
    );

    const existing =
      await workspaceSettingsRepository.findWorkspaceBySlug(
        data.slug.trim().toLowerCase(),
      );

    if (
      existing &&
      existing.id !== data.organizationId
    ) {
      throw new Error(
        "That workspace slug is already in use.",
      );
    }

    const workspace =
      await workspaceSettingsRepository.updateWorkspace(
        data.organizationId,
        {
          name: data.name.trim(),
          slug: data.slug.trim().toLowerCase(),
          description:
            data.description?.trim() || null,
        },
      );

    await auditEventService.recordUpdated({
      organizationId: data.organizationId,
      userId: data.userId,
      entityType: "WORKSPACE",
      entityId: workspace.id,
      metadata: {
        name: workspace.name,
        slug: workspace.slug,
      },
    });

    return workspace;
  },

  async getMembers(
    userId: string,
    organizationId: string,
  ) {
    const membership =
      await workspaceSettingsAuthorizationService.authorizeWorkspaceAccess(
        userId,
        organizationId,
      );

    const members =
      await workspaceSettingsRepository.findMembers(
        organizationId,
      );

    return {
      members,
      viewerRole: membership.role,
    };
  },

  async updateMemberRole(data: {
    actorId: string;
    organizationId: string;
    targetUserId: string;
    role: WorkspaceRole;
  }) {
    await workspaceSettingsAuthorizationService.authorizeMemberMutation(
      data.actorId,
      data.organizationId,
      data.targetUserId,
      data.role,
    );

    const existingMember =
      await workspaceSettingsRepository.findMember(
        data.organizationId,
        data.targetUserId,
      );

    if (!existingMember) {
      throw new Error("Workspace member not found.");
    }

    const member =
      await workspaceSettingsRepository.updateMemberRole(
        data.organizationId,
        data.targetUserId,
        data.role,
      );

    await auditEventService.recordUpdated({
      organizationId: data.organizationId,
      userId: data.actorId,
      entityType: "WORKSPACE_MEMBER",
      entityId: member.id,
      metadata: {
        targetUserId: data.targetUserId,
        previousRole: existingMember.role,
        newRole: member.role,
      },
    });

    return member;
  },

  async removeMember(data: {
    actorId: string;
    organizationId: string;
    targetUserId: string;
  }) {
    await workspaceSettingsAuthorizationService.authorizeMemberRemoval(
      data.actorId,
      data.organizationId,
      data.targetUserId,
    );

    const existingMember =
      await workspaceSettingsRepository.findMember(
        data.organizationId,
        data.targetUserId,
      );

    if (!existingMember) {
      throw new Error("Workspace member not found.");
    }

    const member =
      await workspaceSettingsRepository.deleteMember(
        data.organizationId,
        data.targetUserId,
      );

    await auditEventService.recordRemoved({
      organizationId: data.organizationId,
      userId: data.actorId,
      entityType: "WORKSPACE_MEMBER",
      entityId: member.id,
      metadata: {
        targetUserId: data.targetUserId,
        role: member.role,
      },
    });

    return member;
  },
};