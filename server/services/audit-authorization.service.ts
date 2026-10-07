import { prisma } from "@/lib/db";

export const auditAuthorizationService = {
  async authorizeView(
    organizationId: string,
    userId: string,
  ) {
    const member =
      await prisma.organizationMember.findUnique({
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

    if (!member) {
      throw new Error(
        "WORKSPACE_MEMBERSHIP_REQUIRED",
      );
    }

    return member;
  },
};