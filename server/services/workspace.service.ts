import { auth } from "@/auth";
import { organizationService } from "@/server/services/organization.service";

export const workspaceService = {
  async getUserWorkspaces() {
    const session = await auth();

    if (!session?.user?.id) {
      return [];
    }

    const memberships = await organizationService.getUserOrganizations(
      session.user.id,
    );

    return memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      description: membership.organization.description,
      role: membership.role,
    }));
  },

  async getCurrentUserWorkspace() {
    const workspaces = await this.getUserWorkspaces();

    if (workspaces.length === 0) {
      return null;
    }

    return workspaces[0];
  },
};