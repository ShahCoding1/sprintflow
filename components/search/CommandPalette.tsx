"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FolderKanban,
  Loader2,
  Search,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ProjectResult = {
  id: string;
  name: string;
  key: string;
  description: string | null;
};

type TaskResult = {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  project: {
    name: string;
    key: string;
  };
};

type SprintResult = {
  id: string;
  name: string;
  status: string;
  projectId: string;
  project: {
    name: string;
    key: string;
  };
};

type MemberResult = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type SearchResponse = {
  projects: ProjectResult[];
  tasks: TaskResult[];
  sprints: SprintResult[];
  members: MemberResult[];
};

type SearchItem = {
  id: string;
  type:
    | "project"
    | "task"
    | "sprint"
    | "member";
  title: string;
  subtitle: string;
  href: string;
};

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

function getInitials(
  name: string | null,
  email: string | null,
) {
  const value =
    name?.trim() ||
    email?.trim() ||
    "U";

  const words = value
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getTypeLabel(
  type: SearchItem["type"],
) {
  switch (type) {
    case "project":
      return "Project";
    case "task":
      return "Task";
    case "sprint":
      return "Sprint";
    case "member":
      return "Member";
  }
}

function getTypeIcon(
  type: SearchItem["type"],
) {
  switch (type) {
    case "project":
      return FolderKanban;
    case "task":
      return Zap;
    case "sprint":
      return FolderKanban;
    case "member":
      return Users;
  }
}

export default function CommandPalette({
  open,
  onClose,
}: CommandPaletteProps) {
  const router = useRouter();

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<SearchResponse>({
      projects: [],
      tasks: [],
      sprints: [],
      members: [],
    });

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const search = useCallback(
    async (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) {
        setResults({
          projects: [],
          tasks: [],
          sprints: [],
          members: [],
        });

        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(
            trimmed,
          )}&limit=20`,
          {
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as
            | SearchResponse
            | { message?: string };

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Search failed.",
          );
        }

        setResults(
          data as SearchResponse,
        );
        setSelectedIndex(0);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Search failed.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(
      () => {
        void search(query);
      },
      250,
    );

    return () =>
      window.clearTimeout(timeout);
  }, [open, query, search]);

  const items = useMemo<SearchItem[]>(
    () => [
      ...results.projects.map(
        (project) => ({
          id: project.id,
          type: "project" as const,
          title: project.name,
          subtitle: project.key,
          href: `/projects/${project.id}`,
        }),
      ),

      ...results.tasks.map((task) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        subtitle: `${task.project.key} · ${task.status}`,
        href: `/projects/${task.projectId}/tasks/${task.id}`,
      })),

      ...results.sprints.map((sprint) => ({
        id: sprint.id,
        type: "sprint" as const,
        title: sprint.name,
        subtitle: `${sprint.project.key} · ${sprint.status}`,
        href: `/projects/${sprint.projectId}/sprints/${sprint.id}`,
      })),

      ...results.members.map((member) => ({
        id: member.id,
        type: "member" as const,
        title:
          member.name ||
          member.email ||
          "Unnamed member",
        subtitle:
          member.email ||
          "Workspace member",
        href: "/settings/members",
      })),
    ],
    [results],
  );

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(
        Math.max(items.length - 1, 0),
      );
    }
  }, [items.length, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        setSelectedIndex((current) =>
          items.length === 0
            ? 0
            : (current + 1) % items.length,
        );

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setSelectedIndex((current) =>
          items.length === 0
            ? 0
            : current === 0
              ? items.length - 1
              : current - 1,
        );

        return;
      }

      if (
        event.key === "Enter" &&
        items[selectedIndex]
      ) {
        event.preventDefault();

        const item =
          items[selectedIndex];

        onClose();
        setQuery("");
        router.push(item.href);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [
    items,
    onClose,
    open,
    router,
    selectedIndex,
  ]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults({
        projects: [],
        tasks: [],
        sprints: [],
        members: [],
      });
      setError(null);
      setSelectedIndex(0);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[10vh] backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-2xl">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" />

          <input
            autoFocus
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Search projects, tasks, sprints, members..."
            className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search"
          />

          {isLoading && (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded-md p-1.5 transition hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="border-b px-4 py-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              ↑↓ Navigate
            </span>
            <span>
              Enter Open
            </span>
            <span>
              Esc Close
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {error && (
            <div
              role="alert"
              className="px-4 py-8 text-center text-sm text-destructive"
            >
              {error}
            </div>
          )}

          {!error &&
            !isLoading &&
            query.trim() &&
            items.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Search className="mx-auto size-8 text-muted-foreground/50" />

                <p className="mt-3 text-sm font-medium">
                  No results found
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Try another search term.
                </p>
              </div>
            )}

          {!error &&
            !query.trim() && (
              <div className="px-4 py-12 text-center">
                <Search className="mx-auto size-8 text-muted-foreground/50" />

                <p className="mt-3 text-sm font-medium">
                  Search SprintFlow
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Find projects, tasks, sprints,
                  and workspace members.
                </p>
              </div>
            )}

          {items.length > 0 && (
            <div className="p-2">
              {items.map((item, index) => {
                const Icon =
                  getTypeIcon(item.type);

                const isSelected =
                  index === selectedIndex;

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onMouseEnter={() =>
                      setSelectedIndex(index)
                    }
                    onClick={() => {
                      onClose();
                      setQuery("");
                      router.push(item.href);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      isSelected
                        ? "bg-muted"
                        : "hover:bg-muted/70"
                    }`}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.title}
                      </p>

                      <p className="truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      {getTypeLabel(item.type)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t px-4 py-2.5 text-[11px] text-muted-foreground">
          <span>
            SprintFlow Global Search
          </span>

          <span className="hidden sm:inline">
            Press Ctrl K anytime
          </span>
        </div>
      </div>
    </div>
  );
}