import { cookies } from "next/headers";

import { auth } from "@/auth";
import { organizationRepository } from "@/server/repositories/organization.repository";

const WORKSPACE_COOKIE_NAME = "sprintflow-workspace";

export type WorkspaceContext = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: string;
  userId: string;
};

export const workspaceContextService = {
  async getWorkspaceContext(
    organizationId?: string,
  ): Promise<WorkspaceContext | null> {
    const session = await auth();

    if (!session?.user?.id) {
      return null;
    }

    const userId = session.user.id;

    if (organizationId) {
      return this.getVerifiedWorkspace(userId, organizationId);
    }

    const cookieStore = await cookies();

    const selectedWorkspaceId = cookieStore.get(
      WORKSPACE_COOKIE_NAME,
    )?.value;

    if (selectedWorkspaceId) {
      const selectedWorkspace = await this.getVerifiedWorkspace(
        userId,
        selectedWorkspaceId,
      );

      if (selectedWorkspace) {
        return selectedWorkspace;
      }
    }

    const memberships =
      await organizationRepository.findMembershipsByUserId(userId);

    if (memberships.length === 0) {
      return null;
    }

    const membership = memberships[0];

    return {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      description: membership.organization.description,
      role: membership.role,
      userId,
    };
  },

  async getVerifiedWorkspace(
    userId: string,
    organizationId: string,
  ): Promise<WorkspaceContext | null> {
    const membership =
      await organizationRepository.findMembershipByUserAndOrganization(
        userId,
        organizationId,
      );

    if (!membership) {
      return null;
    }

    return {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      description: membership.organization.description,
      role: membership.role,
      userId,
    };
  },
};