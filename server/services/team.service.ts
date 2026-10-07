import { teamRepository } from "@/server/repositories/team.repository";
import { teamAuthorizationService } from "@/server/services/team-authorization.service";
import { auditEventService } from "@/server/services/audit-event.service";

export const teamService = {
  async getTeams(
    userId: string,
    organizationId: string,
  ) {
    await teamAuthorizationService.authorizeView(
      userId,
      organizationId,
    );

    return teamRepository.findByOrganization(
      organizationId,
    );
  },

  async getTeam(
    userId: string,
    organizationId: string,
    teamId: string,
  ) {
    const { team } =
      await teamAuthorizationService.authorizeTeam(
        userId,
        organizationId,
        teamId,
      );

    return team;
  },

  async createTeam(data: {
    userId: string;
    organizationId: string;
    name: string;
    description?: string | null;
  }) {
    await teamAuthorizationService.authorizeManagement(
      data.userId,
      data.organizationId,
    );

    const name = data.name.trim();

    const existing =
      await teamRepository.findByName(
        data.organizationId,
        name,
      );

    if (existing) {
      throw new Error(
        "A team with this name already exists in the workspace.",
      );
    }

    const team = await teamRepository.create({
      organizationId: data.organizationId,
      name,
      description:
        data.description?.trim() || null,
    });

    await auditEventService.recordCreated({
      organizationId: data.organizationId,
      userId: data.userId,
      entityType: "TEAM",
      entityId: team.id,
      metadata: {
        name: team.name,
      },
    });

    return team;
  },

  async updateTeam(data: {
    userId: string;
    organizationId: string;
    teamId: string;
    name: string;
    description?: string | null;
  }) {
    await teamAuthorizationService.authorizeTeamManagement(
      data.userId,
      data.organizationId,
      data.teamId,
    );

    const name = data.name.trim();

    const existing =
      await teamRepository.findByName(
        data.organizationId,
        name,
      );

    if (
      existing &&
      existing.id !== data.teamId
    ) {
      throw new Error(
        "A team with this name already exists in the workspace.",
      );
    }

    const team = await teamRepository.update(
      data.teamId,
      data.organizationId,
      {
        name,
        description:
          data.description?.trim() || null,
      },
    );

    await auditEventService.recordUpdated({
      organizationId: data.organizationId,
      userId: data.userId,
      entityType: "TEAM",
      entityId: team.id,
      metadata: {
        name: team.name,
      },
    });

    return team;
  },

  async deleteTeam(data: {
    userId: string;
    organizationId: string;
    teamId: string;
  }) {
    await teamAuthorizationService.authorizeTeamManagement(
      data.userId,
      data.organizationId,
      data.teamId,
    );

    const team = await teamRepository.delete(
      data.teamId,
      data.organizationId,
    );

    await auditEventService.recordDeleted({
      organizationId: data.organizationId,
      userId: data.userId,
      entityType: "TEAM",
      entityId: team.id,
      metadata: {
        name: team.name,
      },
    });

    return team;
  },

  async getMembers(data: {
    userId: string;
    organizationId: string;
    teamId: string;
  }) {
    await teamAuthorizationService.authorizeTeam(
      data.userId,
      data.organizationId,
      data.teamId,
    );

    return teamRepository.findMembers(
      data.teamId,
    );
  },

  async addMember(data: {
    userId: string;
    organizationId: string;
    teamId: string;
    targetUserId: string;
  }) {
    await teamAuthorizationService.authorizeMemberMutation(
      data.userId,
      data.organizationId,
      data.teamId,
      data.targetUserId,
    );

    const existing =
      await teamRepository.findMember(
        data.teamId,
        data.targetUserId,
      );

    if (existing) {
      throw new Error(
        "This user is already a member of the team.",
      );
    }

    const member =
      await teamRepository.createMember(
        data.teamId,
        data.targetUserId,
      );

    await auditEventService.recordAdded({
      organizationId: data.organizationId,
      userId: data.userId,
      entityType: "TEAM_MEMBER",
      entityId: member.id,
      metadata: {
        teamId: data.teamId,
        targetUserId: data.targetUserId,
      },
    });

    return member;
  },

  async removeMember(data: {
    userId: string;
    organizationId: string;
    teamId: string;
    targetUserId: string;
  }) {
    await teamAuthorizationService.authorizeMemberMutation(
      data.userId,
      data.organizationId,
      data.teamId,
      data.targetUserId,
    );

    const existing =
      await teamRepository.findMember(
        data.teamId,
        data.targetUserId,
      );

    if (!existing) {
      throw new Error(
        "Team member not found.",
      );
    }

    const member =
      await teamRepository.deleteMember(
        data.teamId,
        data.targetUserId,
      );

    await auditEventService.recordRemoved({
      organizationId: data.organizationId,
      userId: data.userId,
      entityType: "TEAM_MEMBER",
      entityId: member.id,
      metadata: {
        teamId: data.teamId,
        targetUserId: data.targetUserId,
      },
    });

    return member;
  },
};