"use client";

import Link from "next/link";
import { FolderKanban, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type Project = {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description: string | null;
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectsResponse = {
  success: boolean;
  projects?: Project[];
  message?: string;
};

type ProjectListProps = {
  refreshKey: number;
};

function getStatusLabel(status: Project["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function ProjectList({
  refreshKey,
}: ProjectListProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/projects", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });

        const data: ProjectsResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ?? "Unable to load projects.",
          );
        }

        if (!cancelled) {
          setProjects(data.projects ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load projects.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (loading) {
    return (
      <section className="rounded-xl border bg-card">
        <div className="flex min-h-72 items-center justify-center px-4 py-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading projects...</span>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border bg-card">
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <FolderKanban className="h-7 w-7 text-destructive" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Unable to load projects
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {error}
          </p>
        </div>
      </section>
    );
  }

  if (projects.length === 0) {
    return (
      <section className="rounded-xl border bg-card">
        <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <FolderKanban className="h-7 w-7 text-muted-foreground" />
          </div>

          <h2 className="mt-5 text-lg font-semibold">
            Your projects
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Projects created in this workspace will appear here.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Projects"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="group block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Open project ${project.name}`}
        >
          <article className="h-full min-w-0 rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
            <div className="flex min-w-0 items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate font-semibold">
                    {project.name}
                  </h2>

                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {project.key}
                  </p>
                </div>
              </div>

              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                {getStatusLabel(project.status)}
              </span>
            </div>

            <p className="mt-5 line-clamp-2 min-h-10 break-words text-sm leading-5 text-muted-foreground">
              {project.description ||
                "No project description provided."}
            </p>

            <div className="mt-5 border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Project key
              </p>

              <p className="mt-1 text-sm font-medium">
                {project.key}
              </p>
            </div>
          </article>
        </Link>
      ))}
    </section>
  );
}