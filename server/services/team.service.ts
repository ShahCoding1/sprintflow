import { teamRepository } from "@/server/repositories/team.repository";
import { teamAuthorizationService } from "@/server/services/team-authorization.service";

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

    return teamRepository.create({
      organizationId: data.organizationId,
      name,
      description:
        data.description?.trim() || null,
    });
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

    return teamRepository.update(
      data.teamId,
      data.organizationId,
      {
        name,
        description:
          data.description?.trim() || null,
      },
    );
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

    return teamRepository.delete(
      data.teamId,
      data.organizationId,
    );
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

    return teamRepository.createMember(
      data.teamId,
      data.targetUserId,
    );
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

    return teamRepository.deleteMember(
      data.teamId,
      data.targetUserId,
    );
  },
};