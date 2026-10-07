import { prisma } from "@/lib/db";

type LabelMutationAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export const labelAuthorizationService = {
  async authorize(data: {
    organizationId: string;
    userId: string;
    action: LabelMutationAction;
  }) {
    const organizationMember =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId:
              data.organizationId,
            userId: data.userId,
          },
        },
        select: {
          role: true,
        },
      });

    if (!organizationMember) {
      throw new Error(
        "You are not a member of this workspace.",
      );
    }

    if (
      organizationMember.role === "OWNER" ||
      organizationMember.role === "ADMIN"
    ) {
      return true;
    }

    throw new Error(
      "You do not have permission to manage labels.",
    );
  },
};
