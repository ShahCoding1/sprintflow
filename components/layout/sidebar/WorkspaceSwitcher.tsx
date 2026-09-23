"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: string;
};

type WorkspaceSwitcherProps = {
  workspace: Workspace | null;
  workspaces: Workspace[];
};

function getWorkspaceInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "WS";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function WorkspaceSwitcher({
  workspace,
  workspaces,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const workspaceInitials = workspace
    ? getWorkspaceInitials(workspace.name)
    : "WS";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg p-2",
          "text-left transition-colors",
          "hover:bg-muted",
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
          {workspaceInitials}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {workspace?.name ?? "No workspace"}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {workspace?.role ?? "Not configured"}
          </p>
        </div>

        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover p-1 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Workspaces
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {workspaces.map((item) => {
              const isCurrent = item.id === workspace?.id;
              const initials = getWorkspaceInitials(item.name);

              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                    "text-left transition-colors hover:bg-muted",
                    isCurrent && "bg-muted/70",
                  )}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {item.name}
                    </p>

                    <p className="truncate text-xs text-muted-foreground">
                      {item.role}
                    </p>
                  </div>

                  {isCurrent && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted"
          >
            <div className="flex size-8 items-center justify-center rounded-md border">
              <Plus className="size-4" />
            </div>

            <span>Create workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}