"use client";

import {
  BarChart3,
  CheckSquare,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
};

const mainNavigation: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Projects",
    icon: FolderKanban,
    href: "/projects",
  },
  {
    label: "My Tasks",
    icon: CheckSquare,
    href: "/tasks",
  },
  {
    label: "Teams",
    icon: Users,
    href: "/teams",
  },
  {
    label: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
];

const secondaryNavigation: NavItem[] = [
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-background">
      {/* Brand */}
      <div className="flex h-16 items-center border-b px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>

          <span className="text-lg font-semibold tracking-tight">
            SprintFlow
          </span>
        </div>
      </div>

      {/* Workspace */}
      <div className="border-b p-3">
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-2",
            "text-left transition-colors",
            "hover:bg-muted",
          )}
        >
          <div className="flex size-9 items-center justify-center rounded-md bg-muted font-semibold">
            SF
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">SprintFlow Workspace</p>
            <p className="truncate text-xs text-muted-foreground">
              Personal workspace
            </p>
          </div>

          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mainNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5",
                  "text-sm font-medium text-muted-foreground",
                  "transition-colors hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>

        <div className="my-5 h-px bg-border" />

        <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>

        <div className="space-y-1">
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5",
                  "text-sm font-medium text-muted-foreground",
                  "transition-colors hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Upgrade / Pro */}
      <div className="border-t p-3">
        <div className="rounded-xl border bg-muted/40 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <span className="text-sm font-semibold">SprintFlow Pro</span>
          </div>

          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Unlock advanced analytics, automation, and team features.
          </p>

          <button
            type="button"
            className="w-full rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Explore Pro
          </button>
        </div>
      </div>
    </aside>
  );
}