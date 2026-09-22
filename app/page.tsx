import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  Layers3,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    title: "Project Management",
    description:
      "Organize projects, teams, milestones, and work in one centralized workspace.",
  },
  {
    icon: CheckCircle2,
    title: "Task Management",
    description:
      "Create, assign, prioritize, and track tasks from planning through completion.",
  },
  {
    icon: Layers3,
    title: "Sprint Planning",
    description:
      "Plan focused sprints, manage your backlog, and keep your team aligned.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Bring teams together with shared projects, roles, comments, and activity.",
  },
  {
    icon: BarChart3,
    title: "Project Analytics",
    description:
      "Understand velocity, completion, cycle time, and project performance.",
  },
  {
    icon: Zap,
    title: "Smart Workflows",
    description:
      "Build efficient workflows that help your team spend less time managing work.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </div>

            <span className="text-lg font-semibold tracking-tight">
              SprintFlow
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How it works
            </a>

            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-24 lg:pb-32 lg:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
              <Zap className="size-3.5 text-primary" />
              Modern project management for ambitious teams
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
              Plan better.
              <br />
              <span className="text-primary">Build faster.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              SprintFlow brings project management, sprint planning, team
              collaboration, and analytics together in one powerful workspace.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Start building
                <ArrowRight className="size-4" />
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-lg border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
              >
                Explore dashboard
              </Link>
            </div>
          </div>

          {/* Product Preview */}
          <div className="mx-auto mt-20 max-w-6xl">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
              <div className="flex h-12 items-center gap-2 border-b px-4">
                <div className="size-2.5 rounded-full bg-muted-foreground/30" />
                <div className="size-2.5 rounded-full bg-muted-foreground/30" />
                <div className="size-2.5 rounded-full bg-muted-foreground/30" />

                <div className="ml-4 h-7 flex-1 rounded-md bg-muted/50" />
              </div>

              <div className="grid min-h-[360px] md:grid-cols-[220px_1fr]">
                <div className="hidden border-r p-4 md:block">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="size-7 rounded-md bg-primary" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>

                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div
                        key={item}
                        className="h-9 rounded-md bg-muted/50"
                      />
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="mt-2 h-3 w-64 rounded bg-muted/60" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border p-4"
                      >
                        <div className="h-3 w-20 rounded bg-muted" />
                        <div className="mt-4 h-8 w-12 rounded bg-muted" />
                        <div className="mt-4 h-2 w-full rounded bg-muted/50" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border p-4">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="mt-4 h-24 rounded-lg bg-muted/40" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">
              Everything in one place
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your team needs to move work forward.
            </h2>

            <p className="mt-4 text-muted-foreground">
              SprintFlow is designed around the complete software delivery
              lifecycle, from planning and prioritization to execution and
              analysis.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="bg-background p-8 transition-colors hover:bg-muted/30"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-5 font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-primary">
              Simple workflow
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From idea to delivery.
            </h2>

            <p className="mt-4 text-muted-foreground">
              SprintFlow keeps your team&apos;s workflow structured without
              making project management complicated.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                01
              </div>

              <h3 className="mt-5 font-semibold">
                Plan
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create projects, organize your backlog, and define the work
                your team needs to deliver.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                02
              </div>

              <h3 className="mt-5 font-semibold">
                Execute
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Run focused sprints, manage tasks, and collaborate with your
                team throughout development.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                03
              </div>

              <h3 className="mt-5 font-semibold">
                Improve
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use project analytics and team insights to understand
                performance and continuously improve your workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <div className="rounded-3xl border bg-muted/30 px-6 py-16 sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Build your next project with SprintFlow.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Bring your team, projects, tasks, and sprints together in one
              workspace.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Zap className="size-3.5" />
            </div>

            <span className="text-sm font-semibold">
              SprintFlow
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            Modern project management for modern teams.
          </p>
        </div>
      </footer>
    </main>
  );
}