import { prisma } from "@/lib/db";

export const labelRepository = {
  findById(id: string) {
    return prisma.taskLabel.findUnique({
      where: { id },
    });
  },

  findByOrganization(organizationId: string) {
    return prisma.taskLabel.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        name: "asc",
      },
    });
  },

  create(data: {
    organizationId: string;
    name: string;
    color: string;
  }) {
    return prisma.taskLabel.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        color: data.color,
      },
    });
  },

  update(
    id: string,
    data: {
      name: string;
      color: string;
    },
  ) {
    return prisma.taskLabel.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
      },
    });
  },

  delete(id: string) {
    return prisma.taskLabel.delete({
      where: { id },
    });
  },
};