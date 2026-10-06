import { notFound } from "next/navigation";

import ProjectDetail from "@/components/projects/ProjectDetail";
import SprintList from "@/components/sprints/SprintList";
import TaskBoard from "@/components/tasks/TaskBoard";
import { projectService } from "@/server/services/project.service";
import { sprintService } from "@/server/services/sprint.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectPage({
  params,
}: ProjectPageProps) {
  const { projectId } = await params;

  const workspace =
    await workspaceContextService.getWorkspaceContext();

  if (!workspace) {
    notFound();
  }

  const project =
    await projectService.getProject(
      projectId,
      workspace.id,
    );

  if (!project) {
    notFound();
  }

  const sprints =
    await sprintService.getSprints({
      projectId: project.id,
      organizationId: workspace.id,
    });

  const initialSprints =
    sprints.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate:
        sprint.startDate?.toISOString() ??
        null,
      endDate:
        sprint.endDate?.toISOString() ??
        null,
      createdAt:
        sprint.createdAt.toISOString(),
      updatedAt:
        sprint.updatedAt.toISOString(),
      _count: {
        tasks: sprint._count.tasks,
      },
    }));

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <ProjectDetail project={project} />

      <div className="mt-8">
        <SprintList
          projectId={project.id}
          initialSprints={initialSprints}
        />
      </div>

      <div className="mt-8">
        <TaskBoard
          projectId={project.id}
        />
      </div>
    </main>
  );
}