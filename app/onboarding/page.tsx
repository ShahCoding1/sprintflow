"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const name = String(formData.get("name") ?? "");
    const slug = String(formData.get("slug") ?? "");
    const description = String(formData.get("description") ?? "");

    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          slug,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Unable to create your workspace.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
        <div className="w-full">
          {/* Header */}
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              SprintFlow
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Create your workspace
            </h1>

            <p className="mt-3 max-w-2xl text-muted-foreground">
              Your workspace is the central place where your team manages
              projects, sprints, tasks, and collaboration.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workspace Name */}
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium"
                >
                  Workspace name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Acme Software"
                  required
                  minLength={2}
                  maxLength={100}
                  className="h-11 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="text-xs text-muted-foreground">
                  This is the name your team will see throughout SprintFlow.
                </p>
              </div>

              {/* Workspace Slug */}
              <div className="space-y-2">
                <label
                  htmlFor="slug"
                  className="text-sm font-medium"
                >
                  Workspace URL
                </label>

                <div className="flex items-center overflow-hidden rounded-lg border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <span className="border-r bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                    sprintflow.app/
                  </span>

                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="acme-software"
                    required
                    minLength={2}
                    maxLength={50}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-sm font-medium"
                >
                  Description
                  <span className="ml-1 font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  maxLength={500}
                  placeholder="A short description of your workspace..."
                  className="w-full resize-none rounded-lg border bg-background px-3 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-medium transition hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
                >
                  Skip for now
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
                >
                  {isLoading && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {isLoading
                    ? "Creating workspace..."
                    : "Create workspace"}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            You can invite your team and create projects after setting up your
            workspace.
          </p>
        </div>
      </div>
    </main>
  );
}