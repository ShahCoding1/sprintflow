import { projectRepository } from "@/server/repositories/project.repository";

export const projectService = {
  async createProject(data: {
    organizationId: string;
    name: string;
    key: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const normalizedKey = data.key.trim().toUpperCase();

    const existingProject = await projectRepository.findByKey(
      data.organizationId,
      normalizedKey,
    );

    if (existingProject) {
      throw new Error(
        `A project with the key "${normalizedKey}" already exists in this workspace.`,
      );
    }

    const project = await projectRepository.create({
      organizationId: data.organizationId,
      name: data.name.trim(),
      key: normalizedKey,
      description: data.description?.trim() || undefined,
      startDate: data.startDate,
      endDate: data.endDate,
    });

    return project;
  },

  async getProject(
    projectId: string,
    organizationId: string,
  ) {
    return projectRepository.findByIdAndOrganization(
      projectId,
      organizationId,
    );
  },

  async getProjects(organizationId: string) {
    return projectRepository.findManyByOrganization(
      organizationId,
    );
  },

  async updateProject(data: {
    projectId: string;
    organizationId: string;
    name: string;
    key: string;
    description?: string;
    status:
      | "PLANNING"
      | "ACTIVE"
      | "COMPLETED"
      | "ARCHIVED";
    startDate?: Date | null;
    endDate?: Date | null;
  }) {
    const normalizedKey = data.key.trim().toUpperCase();

    const existingProject =
      await projectRepository.findByIdAndOrganization(
        data.projectId,
        data.organizationId,
      );

    if (!existingProject) {
      throw new Error("Project not found.");
    }

    const projectWithSameKey =
      await projectRepository.findByKey(
        data.organizationId,
        normalizedKey,
      );

    if (
      projectWithSameKey &&
      projectWithSameKey.id !== data.projectId
    ) {
      throw new Error(
        `A project with the key "${normalizedKey}" already exists in this workspace.`,
      );
    }

    const project = await projectRepository.update(
      data.projectId,
      {
        name: data.name.trim(),
        key: normalizedKey,
        description:
          data.description?.trim() || undefined,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    );

    return project;
  },
};