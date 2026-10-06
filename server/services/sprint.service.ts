import { projectRepository } from "@/server/repositories/project.repository";
import { sprintRepository } from "@/server/repositories/sprint.repository";

type SprintStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED";

export const sprintService = {
  async getSprints(data: {
    projectId: string;
    organizationId: string;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    return sprintRepository.findByProject(
      data.projectId,
    );
  },

  async createSprint(data: {
    projectId: string;
    organizationId: string;
    name: string;
    goal?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    const existingSprints =
      await sprintRepository.findByProject(
        data.projectId,
      );

    const duplicate =
      existingSprints.some(
        (sprint) =>
          sprint.name.toLowerCase() ===
          data.name.trim().toLowerCase(),
      );

    if (duplicate) {
      throw new Error(
        "A sprint with this name already exists.",
      );
    }

    return sprintRepository.create({
      projectId: data.projectId,
      name: data.name.trim(),
      goal:
        data.goal?.trim() || null,
      startDate: data.startDate,
      endDate: data.endDate,
    });
  },

  async updateSprint(data: {
    sprintId: string;
    projectId: string;
    organizationId: string;
    name: string;
    goal?: string | null;
    status: SprintStatus;
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    const sprint =
      await sprintRepository.findByIdAndProject(
        data.sprintId,
        data.projectId,
      );

    if (!sprint) {
      throw new Error("Sprint not found.");
    }

    const existingSprints =
      await sprintRepository.findByProject(
        data.projectId,
      );

    const duplicate =
      existingSprints.some(
        (item) =>
          item.id !== data.sprintId &&
          item.name.toLowerCase() ===
            data.name.trim().toLowerCase(),
      );

    if (duplicate) {
      throw new Error(
        "A sprint with this name already exists.",
      );
    }

    if (
      data.status === "ACTIVE"
    ) {
      const activeSprint =
        existingSprints.find(
          (item) =>
            item.id !==
              data.sprintId &&
            item.status ===
              "ACTIVE",
        );

      if (activeSprint) {
        throw new Error(
          "Only one sprint can be active at a time.",
        );
      }
    }

    return sprintRepository.update(
      data.sprintId,
      {
        name: data.name.trim(),
        goal:
          data.goal?.trim() || null,
        status: data.status,
        startDate:
          data.startDate,
        endDate:
          data.endDate,
      },
    );
  },

  async deleteSprint(data: {
    sprintId: string;
    projectId: string;
    organizationId: string;
  }) {
    const project =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!project) {
      throw new Error("Project not found.");
    }

    const sprint =
      await sprintRepository.findByIdAndProject(
        data.sprintId,
        data.projectId,
      );

    if (!sprint) {
      throw new Error("Sprint not found.");
    }

    if (
      sprint.status ===
      "ACTIVE"
    ) {
      throw new Error(
        "An active sprint cannot be deleted.",
      );
    }

    if (
      sprint._count.tasks > 0
    ) {
      throw new Error(
        "A sprint containing tasks cannot be deleted.",
      );
    }

    return sprintRepository.delete(
      data.sprintId,
    );
  },
};