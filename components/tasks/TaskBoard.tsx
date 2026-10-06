"use client";

import {
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "@/components/ui/button";

import CreateTaskDialog from "./CreateTaskDialog";
import TaskColumn from "./TaskColumn";
import type { BoardTask } from "./TaskCard";

type TaskBoardProps = {
  projectId: string;
};

const columns = [
  { status: "TODO" as const, title: "To Do" },
  { status: "IN_PROGRESS" as const, title: "In Progress" },
  { status: "IN_REVIEW" as const, title: "In Review" },
  { status: "DONE" as const, title: "Done" },
  { status: "BLOCKED" as const, title: "Blocked" },
];

type TaskResponse = {
  success: boolean;
  tasks?: BoardTask[];
  message?: string;
};

export default function TaskBoard({
  projectId,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks`,
        {
          cache: "no-store",
        },
      );

      const result = (await response.json()) as TaskResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Unable to load tasks.",
        );
      }

      setTasks(result.tasks ?? []);
      setError(null);
    } catch (error) {
      console.error("Load task board error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;

    const initializeBoard = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks`,
          {
            cache: "no-store",
          },
        );

        const result = (await response.json()) as TaskResponse;

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ?? "Unable to load tasks.",
          );
        }

        if (!cancelled) {
          setTasks(result.tasks ?? []);
          setError(null);
        }
      } catch (error) {
        console.error("Load task board error:", error);

        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load tasks.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void initializeBoard();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const groupedTasks = useMemo(() => {
    return columns.reduce(
      (groups, column) => {
        groups[column.status] = tasks
          .filter(
            (task) => task.status === column.status,
          )
          .sort(
            (a, b) => a.position - b.position,
          );

        return groups;
      },
      {} as Record<
        (typeof columns)[number]["status"],
        BoardTask[]
      >,
    );
  }, [tasks]);

  const handleTaskCreated = (task: BoardTask) => {
    setTasks((currentTasks) => [
      ...currentTasks,
      task,
    ]);
  };

  const handleTaskUpdated = (updatedTask: BoardTask) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id
          ? updatedTask
          : task,
      ),
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-2xl border bg-card">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          Loading task board...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border bg-card px-6 text-center">
        <AlertCircle className="size-10 text-destructive" />

        <h2 className="mt-4 text-base font-semibold">
          Unable to load task board
        </h2>

        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error}
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => {
            setLoading(true);
            void loadTasks();
          }}
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Task Board
          </h2>

          <p className="text-sm text-muted-foreground">
            Manage work across your project workflow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void loadTasks();
            }}
          >
            <RefreshCw className="size-4" />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </Button>

          <CreateTaskDialog
            projectId={projectId}
            onCreated={handleTaskCreated}
          />
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <TaskColumn
            key={column.status}
            projectId={projectId}
            title={column.title}
            tasks={groupedTasks[column.status]}
            onUpdated={handleTaskUpdated}
          />
        ))}
      </div>
    </div>
  );
}