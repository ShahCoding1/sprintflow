import { notFound } from "next/navigation";

import ProjectDetail from "@/components/projects/ProjectDetail";
import TaskBoard from "@/components/tasks/TaskBoard";
import { projectService } from "@/server/services/project.service";
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

  return (
    <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
      <ProjectDetail project={project} />

      <div className="mt-8">
        <TaskBoard
          projectId={project.id}
        />
      </div>
    </main>
  );
}