import { searchRepository } from "@/server/repositories/search.repository";

export const searchService = {
  async search(data: {
    organizationId: string;
    query: string;
    limit: number;
  }) {
    const query = data.query.trim();

    if (!query) {
      return {
        projects: [],
        tasks: [],
        sprints: [],
        members: [],
      };
    }

    const perTypeLimit = Math.max(
      1,
      Math.ceil(data.limit / 4),
    );

    const [
      projects,
      tasks,
      sprints,
      members,
    ] = await Promise.all([
      searchRepository.searchProjects({
        organizationId: data.organizationId,
        query,
        limit: perTypeLimit,
      }),

      searchRepository.searchTasks({
        organizationId: data.organizationId,
        query,
        limit: perTypeLimit,
      }),

      searchRepository.searchSprints({
        organizationId: data.organizationId,
        query,
        limit: perTypeLimit,
      }),

      searchRepository.searchMembers({
        organizationId: data.organizationId,
        query,
        limit: perTypeLimit,
      }),
    ]);

    return {
      projects,
      tasks,
      sprints,
      members,
    };
  },
};