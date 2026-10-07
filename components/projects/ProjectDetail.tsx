"use client";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  ListTodo,
  Pencil,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import EditProjectDialog from "@/components/projects/EditProjectDialog";
import ProjectMembers from "@/components/projects/ProjectMembers";

type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "COMPLETED"
  | "ARCHIVED";

type Project = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | string | null;
  endDate: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type ProjectSummary = {
  taskCount: number;
  memberCount: number;
  sprintCount: number;
};

type ProjectDetailProps = {
  project: Project;
  summary: ProjectSummary;
};

function formatDate(
  date: Date | string | null,
) {
  if (!date) {
    return "Not set";
  }

  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(parsedDate);
}

function getStatusLabel(
  status: ProjectStatus,
) {
  switch (status) {
    case "PLANNING":
      return "Planning";

    case "ACTIVE":
      return "Active";

    case "COMPLETED":
      return "Completed";

    case "ARCHIVED":
      return "Archived";

    default:
      return status;
  }
}

function getStatusClasses(
  status: ProjectStatus,
) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400";

    case "ARCHIVED":
      return "bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400";

    case "PLANNING":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400";
  }
}

export default function ProjectDetail({
  project: initialProject,
  summary,
}: ProjectDetailProps) {
  const [project, setProject] =
    useState<Project>(
      initialProject,
    );

  const [
    editDialogOpen,
    setEditDialogOpen,
  ] = useState(false);

  const statusLabel =
    getStatusLabel(project.status);

  const statusClasses =
    getStatusClasses(
      project.status,
    );

  function handleProjectUpdated(
    updatedProject: Project,
  ) {
    setProject(updatedProject);
  }

  return (
    <>
      <div className="min-w-0 space-y-6">
        {/* Breadcrumb */}
        <div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to projects</span>
          </Link>
        </div>

        {/* Project Header */}
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              {/* Project Identity */}
              <div className="min-w-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:h-14 sm:w-14">
                    <FolderKanban className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold text-muted-foreground">
                        {project.key}
                      </span>

                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClasses}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                      {project.name}
                    </h1>

                    <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-muted-foreground sm:text-base">
                      {project.description ||
                        "No project description has been added yet."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Project Actions */}
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEditDialogOpen(true)
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit project
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground opacity-60"
                >
                  Open board
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Project Stats */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ProjectStat
            icon={ListTodo}
            label="Tasks"
            value={String(
              summary.taskCount,
            )}
            description="Tasks in this project"
          />

          <ProjectStat
            icon={Users}
            label="Members"
            value={String(
              summary.memberCount,
            )}
            description="Project members"
          />

          <ProjectStat
            icon={CheckCircle2}
            label="Sprints"
            value={String(
              summary.sprintCount,
            )}
            description="Project sprints"
          />

          <ProjectStat
            icon={CalendarDays}
            label="Status"
            value={statusLabel}
            description="Current project status"
            valueClassName="text-base sm:text-lg"
          />
        </section>

        {/* Project Information */}
        <section className="rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-5 py-5 sm:px-6">
            <h2 className="text-lg font-semibold">
              Project information
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Key information about this project.
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <ProjectInformation
              label="Project key"
              value={project.key}
            />

            <ProjectInformation
              label="Project status"
              value={statusLabel}
            />

            <ProjectInformation
              label="Start date"
              value={formatDate(
                project.startDate,
              )}
            />

            <ProjectInformation
              label="End date"
              value={formatDate(
                project.endDate,
              )}
            />

            <ProjectInformation
              label="Created"
              value={formatDate(
                project.createdAt,
              )}
            />

            <ProjectInformation
              label="Last updated"
              value={formatDate(
                project.updatedAt,
              )}
            />
          </div>
        </section>

        {/* Project Members */}
        <ProjectMembers
          projectId={project.id}
        />

        {/* Coming Next */}
        <section className="rounded-2xl border border-dashed bg-muted/20 p-6 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-background shadow-sm">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>

            <h2 className="mt-4 text-lg font-semibold">
              Your project workspace
            </h2>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Tasks, sprints, team members,
              backlog, activity, and project
              analytics will appear here as we
              build the project workspace.
            </p>
          </div>
        </section>
      </div>

      <EditProjectDialog
        open={editDialogOpen}
        project={project}
        onOpenChange={
          setEditDialogOpen
        }
        onUpdated={
          handleProjectUpdated
        }
      />
    </>
  );
}

type ProjectStatProps = {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
  description: string;
  valueClassName?: string;
};

function ProjectStat({
  icon: Icon,
  label,
  value,
  description,
  valueClassName,
}: ProjectStatProps) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {label}
          </p>

          <p
            className={`mt-2 truncate text-2xl font-semibold tracking-tight sm:text-3xl ${
              valueClassName ?? ""
            }`}
          >
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

type ProjectInformationProps = {
  label: string;
  value: string;
};

function ProjectInformation({
  label,
  value,
}: ProjectInformationProps) {
  return (
    <div className="min-w-0 px-5 py-5 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}