import { prisma } from "@/lib/db";

export const organizationRepository = {
  findBySlug(slug: string) {
    return prisma.organization.findUnique({
      where: {
        slug,
      },
    });
  },

  findById(id: string) {
    return prisma.organization.findUnique({
      where: {
        id,
      },
    });
  },

  findMembershipsByUserId(userId: string) {
    return prisma.organizationMember.findMany({
      where: {
        userId,
      },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  create(data: {
    name: string;
    slug: string;
    description?: string;
  }) {
    return prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
  },

  addMember(data: {
    organizationId: string;
    userId: string;
  }) {
    return prisma.organizationMember.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: "OWNER",
      },
    });
  },
};