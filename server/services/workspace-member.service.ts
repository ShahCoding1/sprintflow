import { workspaceMemberRepository } from "@/server/repositories/workspace-member.repository";

export const workspaceMemberService = {
  async getWorkspaceMembers(
    organizationId: string,
  ) {
    const members =
      await workspaceMemberRepository.findManyByOrganization(
        organizationId,
      );

    return members.map((member) => ({
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
      image: member.user.image,
      organizationRole: member.role,
    }));
  },
};