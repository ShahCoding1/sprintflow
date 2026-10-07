import { prisma } from "@/lib/db";

import { labelRepository } from "@/server/repositories/label.repository";

export const labelService = {
  async getLabels(organizationId: string) {
    return labelRepository.findByOrganization(
      organizationId,
    );
  },

  async createLabel(data: {
    organizationId: string;
    name: string;
    color: string;
  }) {
    const name = data.name.trim();

    const existing =
      await prisma.taskLabel.findFirst({
        where: {
          organizationId: data.organizationId,
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      throw new Error(
        "A label with this name already exists.",
      );
    }

    return labelRepository.create({
      organizationId: data.organizationId,
      name,
      color: data.color,
    });
  },

  async updateLabel(data: {
    id: string;
    organizationId: string;
    name: string;
    color: string;
  }) {
    const label =
      await labelRepository.findById(data.id);

    if (
      !label ||
      label.organizationId !==
        data.organizationId
    ) {
      throw new Error("Label not found.");
    }

    const name = data.name.trim();

    const duplicate =
      await prisma.taskLabel.findFirst({
        where: {
          organizationId: data.organizationId,
          name: {
            equals: name,
            mode: "insensitive",
          },
          NOT: {
            id: data.id,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicate) {
      throw new Error(
        "A label with this name already exists.",
      );
    }

    return labelRepository.update(
      data.id,
      {
        name,
        color: data.color,
      },
    );
  },

  async deleteLabel(data: {
    id: string;
    organizationId: string;
  }) {
    const label =
      await labelRepository.findById(data.id);

    if (
      !label ||
      label.organizationId !==
        data.organizationId
    ) {
      throw new Error("Label not found.");
    }

    return labelRepository.delete(data.id);
  },
};