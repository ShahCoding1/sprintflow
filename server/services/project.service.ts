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
};