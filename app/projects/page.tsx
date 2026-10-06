"use client";

import { FolderKanban, Plus, Search } from "lucide-react";
import { useState } from "react";

import CreateProjectDialog from "@/components/projects/CreateProjectDialog";
import ProjectList from "@/components/projects/ProjectList";

export default function ProjectsPage() {
  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

  const [projectRefreshKey, setProjectRefreshKey] =
    useState(0);

  function handleProjectCreated() {
    setProjectRefreshKey((current) => current + 1);
  }

  function openCreateDialog() {
    setCreateDialogOpen(true);
  }

  return (
    <>
      <main className="space-y-8">
        {/* Page Header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>

              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Projects
                </h1>

                <p className="text-sm text-muted-foreground">
                  Manage and organize your workspace projects.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateDialog}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </section>

        {/* Search */}
        <section className="rounded-xl border bg-card p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              type="search"
              placeholder="Search projects..."
              className="h-10 w-full rounded-lg border bg-background pl-9 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </section>

        {/* Projects */}
        <ProjectList refreshKey={projectRefreshKey} />
      </main>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreated={handleProjectCreated}
      />
    </>
  );
}