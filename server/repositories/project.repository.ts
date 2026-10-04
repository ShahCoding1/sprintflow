import { prisma } from "@/lib/db";

export const projectRepository = {
  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
    });
  },

  findByIdAndOrganization(id: string, organizationId: string) {
    return prisma.project.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  },

  findByKey(organizationId: string, key: string) {
    return prisma.project.findUnique({
      where: {
        organizationId_key: {
          organizationId,
          key,
        },
      },
    });
  },

  findManyByOrganization(organizationId: string) {
    return prisma.project.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  create(data: {
    organizationId: string;
    name: string;
    key: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return prisma.project.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        key: data.key,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  },
};