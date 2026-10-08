import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import ProjectTimeSummary from "@/components/time-tracking/ProjectTimeSummary";
import UserTimeSummary from "@/components/time-tracking/UserTimeSummary";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectTimeTrackingPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    select: {
      id: true,
      name: true,
      organizationId: true,
    },
  });

  if (!project) {
    notFound();
  }

  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: project.organizationId,
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

  if (!membership) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Project
        </p>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {project.name} — Time Tracking
        </h1>

        <p className="max-w-2xl text-sm text-muted-foreground">
          Review tracked work across contributors and tasks.
        </p>
      </header>

      <UserTimeSummary projectId={project.id} />

      <ProjectTimeSummary projectId={project.id} />
    </main>
  );
}