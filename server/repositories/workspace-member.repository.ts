import { prisma } from "@/lib/db";

export const workspaceMemberRepository = {
  findManyByOrganization(organizationId: string) {
    return prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },
};