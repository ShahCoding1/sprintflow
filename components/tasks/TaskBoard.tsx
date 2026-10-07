"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  AlertCircle,
  Check,
  ChevronDown,
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
import TaskCard, {
  type BoardTask,
  type TaskStatus,
} from "./TaskCard";
import TaskColumn from "./TaskColumn";

type TaskBoardProps = {
  projectId: string;
};

const columns: {
  status: TaskStatus;
  title: string;
}[] = [
  {
    status: "TODO",
    title: "To Do",
  },
  {
    status: "IN_PROGRESS",
    title: "In Progress",
  },
  {
    status: "IN_REVIEW",
    title: "In Review",
  },
  {
    status: "DONE",
    title: "Done",
  },
  {
    status: "BLOCKED",
    title: "Blocked",
  },
];

type TaskResponse = {
  success: boolean;
  tasks?: BoardTask[];
  message?: string;
};

type MoveResponse = {
  success: boolean;
  task?: BoardTask;
  message?: string;
};

type SprintOption = {
  id: string;
  name: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  _count: {
    tasks: number;
  };
};

type SprintResponse = {
  success: boolean;
  sprints?: SprintOption[];
  message?: string;
};

function getColumnTasks(
  tasks: BoardTask[],
  status: TaskStatus,
) {
  return tasks
    .filter((task) => task.status === status)
    .sort(
      (a, b) => a.position - b.position,
    );
}

export default function TaskBoard({
  projectId,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<BoardTask[]>(
    [],
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [activeTaskId, setActiveTaskId] =
    useState<string | null>(null);

  const [sprints, setSprints] =
    useState<SprintOption[]>([]);

  const [selectedSprintId, setSelectedSprintId] =
    useState<string>("ALL");

  const [sprintsLoading, setSprintsLoading] =
    useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter:
        sortableKeyboardCoordinates,
    }),
  );

  const loadTasks = useCallback(
    async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/tasks`,
          {
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as TaskResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Unable to load tasks.",
          );
        }

        setTasks(result.tasks ?? []);
        setError(null);
      } catch (error) {
        console.error(
          "Load task board error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load tasks.",
        );
      } finally {
        setLoading(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    let cancelled = false;

    const initializeBoard =
      async () => {
        try {
          const response =
            await fetch(
              `/api/projects/${projectId}/tasks`,
              {
                cache: "no-store",
              },
            );

          const result =
            (await response.json()) as TaskResponse;

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ??
                "Unable to load tasks.",
            );
          }

          if (!cancelled) {
            setTasks(
              result.tasks ?? [],
            );
            setError(null);
          }

          try {
            const sprintResponse =
              await fetch(
                `/api/projects/${projectId}/sprints`,
                {
                  cache: "no-store",
                },
              );

            const sprintResult =
              (await sprintResponse.json()) as SprintResponse;

            if (
              !sprintResponse.ok ||
              !sprintResult.success
            ) {
              throw new Error(
                sprintResult.message ??
                  "Unable to load sprints.",
              );
            }

            if (!cancelled) {
              setSprints(
                sprintResult.sprints ?? [],
              );
            }
          } catch (sprintError) {
            console.error(
              "Load sprint filter error:",
              sprintError,
            );

            if (!cancelled) {
              setSprints([]);
            }
          } finally {
            if (!cancelled) {
              setSprintsLoading(false);
            }
          }
        } catch (error) {
          console.error(
            "Load task board error:",
            error,
          );

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


  const filteredTasks = useMemo(
    () => {
      if (selectedSprintId === "ALL") {
        return tasks;
      }

      if (selectedSprintId === "BACKLOG") {
        return tasks.filter(
          (task) => !task.sprintId,
        );
      }

      return tasks.filter(
        (task) =>
          task.sprintId ===
          selectedSprintId,
      );
    },
    [selectedSprintId, tasks],
  );

  const groupedTasks = useMemo(
    () => ({
      TODO: getColumnTasks(
        filteredTasks,
        "TODO",
      ),
      IN_PROGRESS: getColumnTasks(
        filteredTasks,
        "IN_PROGRESS",
      ),
      IN_REVIEW: getColumnTasks(
        filteredTasks,
        "IN_REVIEW",
      ),
      DONE: getColumnTasks(
        filteredTasks,
        "DONE",
      ),
      BLOCKED: getColumnTasks(
        filteredTasks,
        "BLOCKED",
      ),
    }),
    [filteredTasks],
  );

  const activeTask = activeTaskId
    ? tasks.find(
        (task) =>
          task.id === activeTaskId,
      ) ?? null
    : null;

  const handleTaskCreated = (
    task: BoardTask,
  ) => {
    setTasks((currentTasks) => [
      ...currentTasks,
      task,
    ]);
  };

  const handleTaskUpdated = (
    updatedTask: BoardTask,
  ) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === updatedTask.id
          ? updatedTask
          : task,
      ),
    );
  };

  const handleDragStart = (
    event: DragStartEvent,
  ) => {
    setActiveTaskId(
      String(event.active.id),
    );
  };

  const handleDragCancel = () => {
    setActiveTaskId(null);
  };

  const handleDragEnd = async (
    event: DragEndEvent,
  ) => {
    setActiveTaskId(null);

    const {
      active,
      over,
    } = event;

    if (!over) {
      return;
    }

    const activeId = String(
      active.id,
    );

    const overId = String(
      over.id,
    );

    const currentTask =
      tasks.find(
        (task) =>
          task.id === activeId,
      );

    if (!currentTask) {
      return;
    }

    const sourceStatus =
      currentTask.status;

    let destinationStatus:
      | TaskStatus
      | null = null;

    const overTask =
      tasks.find(
        (task) =>
          task.id === overId,
      );

    if (overTask) {
      destinationStatus =
        overTask.status;
    } else {
      const column =
        columns.find(
          (item) =>
            item.status ===
            overId,
        );

      destinationStatus =
        column?.status ?? null;
    }

    if (!destinationStatus) {
      return;
    }

    const sourceTasks =
      getColumnTasks(
        tasks,
        sourceStatus,
      );

    const destinationTasks =
      getColumnTasks(
        tasks,
        destinationStatus,
      );

    const sourceIndex =
      sourceTasks.findIndex(
        (task) =>
          task.id === activeId,
      );

    if (sourceIndex === -1) {
      return;
    }

    let destinationIndex =
      destinationTasks.findIndex(
        (task) =>
          task.id === overId,
      );

    if (
      destinationIndex === -1
    ) {
      destinationIndex =
        destinationTasks.length;
    }

    if (
      sourceStatus ===
        destinationStatus &&
      overTask
    ) {
      const overIndex =
        sourceTasks.findIndex(
          (task) =>
            task.id === overId,
        );

      if (overIndex === -1) {
        return;
      }

      if (
        sourceIndex ===
        overIndex
      ) {
        return;
      }

      const reordered =
        arrayMove(
          sourceTasks,
          sourceIndex,
          overIndex,
        );

      const previousTasks =
        tasks;

      const updatedTasks =
        tasks.map((task) => {
          const reorderedTask =
            reordered.find(
              (item) =>
                item.id ===
                task.id,
            );

          if (!reorderedTask) {
            return task;
          }

          return {
            ...task,
            position:
              reordered.indexOf(
                reorderedTask,
              ),
          };
        });

      setTasks(updatedTasks);

      const targetPosition =
        reordered.findIndex(
          (task) =>
            task.id ===
            activeId,
        );

      try {
        const response =
          await fetch(
            `/api/projects/${projectId}/tasks/${activeId}/move`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                status:
                  destinationStatus,
                position:
                  targetPosition,
              }),
            },
          );

        const result =
          (await response.json()) as MoveResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Unable to save task position.",
          );
        }

        if (result.task) {
          setTasks(
            (currentTasks) =>
              currentTasks.map(
                (task) =>
                  task.id ===
                  result.task?.id
                    ? result.task!
                    : task,
              ),
          );
        }
      } catch (error) {
        console.error(
          "Move task error:",
          error,
        );

        setTasks(
          previousTasks,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to save task position.",
        );
      }

      return;
    }

    if (
      sourceStatus !==
      destinationStatus
    ) {
      const previousTasks =
        tasks;

      const nextSourceTasks =
        sourceTasks.filter(
          (task) =>
            task.id !== activeId,
        );

      const movedTask = {
        ...currentTask,
        status:
          destinationStatus,
      };

      const nextDestinationTasks =
        [...destinationTasks];

      if (
        overTask
      ) {
        const targetIndex =
          nextDestinationTasks.findIndex(
            (task) =>
              task.id ===
              overId,
          );

        nextDestinationTasks.splice(
          targetIndex,
          0,
          movedTask,
        );
      } else {
        nextDestinationTasks.push(
          movedTask,
        );
      }

      const nextTasks =
        tasks.map(
          (task) => {
            if (
              task.status ===
              sourceStatus
            ) {
              const reorderedIndex =
                nextSourceTasks.findIndex(
                  (item) =>
                    item.id ===
                    task.id,
                );

              if (
                reorderedIndex !==
                -1
              ) {
                return {
                  ...task,
                  position:
                    reorderedIndex,
                };
              }
            }

            if (
              task.status ===
              destinationStatus
            ) {
              const reorderedIndex =
                nextDestinationTasks.findIndex(
                  (item) =>
                    item.id ===
                    task.id,
                );

              if (
                reorderedIndex !==
                -1
              ) {
                return {
                  ...task,
                  position:
                    reorderedIndex,
                };
              }
            }

            if (
              task.id ===
              activeId
            ) {
              return {
                ...task,
                status:
                  destinationStatus,
                position:
                  destinationIndex,
              };
            }

            return task;
          },
        );

      setTasks(nextTasks);

      try {
        const response =
          await fetch(
            `/api/projects/${projectId}/tasks/${activeId}/move`,
            {
              method: "PATCH",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                status:
                  destinationStatus,
                position:
                  destinationIndex,
              }),
            },
          );

        const result =
          (await response.json()) as MoveResponse;

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ??
              "Unable to move task.",
          );
        }

        if (result.task) {
          setTasks(
            (currentTasks) =>
              currentTasks.map(
                (task) =>
                  task.id ===
                  result.task?.id
                    ? result.task!
                    : task,
              ),
          );
        }
      } catch (error) {
        console.error(
          "Move task error:",
          error,
        );

        setTasks(
          previousTasks,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to move task.",
        );
      }

      return;
    }

    const destinationIndexForColumn =
      destinationTasks.length;

    const previousTasks =
      tasks;

    const movedTask = {
      ...currentTask,
      status:
        destinationStatus,
      position:
        destinationIndexForColumn,
    };

    setTasks((currentTasks) =>
      currentTasks.map(
        (task) =>
          task.id === activeId
            ? movedTask
            : task,
      ),
    );

    try {
      const response =
        await fetch(
          `/api/projects/${projectId}/tasks/${activeId}/move`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              status:
                destinationStatus,
              position:
                destinationIndexForColumn,
            }),
          },
        );

      const result =
        (await response.json()) as MoveResponse;

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Unable to move task.",
        );
      }

      if (result.task) {
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (task) =>
                task.id ===
                result.task?.id
                  ? result.task!
                  : task,
            ),
        );
      }
    } catch (error) {
      console.error(
        "Move task error:",
        error,
      );

      setTasks(
        previousTasks,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to move task.",
      );
    }
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

  if (error && tasks.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl borderbg-card px-6 text-center">
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
      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Task Board
          </h2>

          <p className="text-sm text-muted-foreground">
            Manage work across your project workflow.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label
            htmlFor="task-board-sprint-filter"
            className="sr-only"
          >
            Filter tasks by sprint
          </label>

          <div className="relative">
            <select
              id="task-board-sprint-filter"
              value={selectedSprintId}
              onChange={(event) =>
                setSelectedSprintId(
                  event.target.value,
                )
              }
              disabled={sprintsLoading}
              className="h-9 w-full appearance-none rounded-lg border bg-background py-2 pl-3 pr-9 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-[220px]"
            >
              <option value="ALL">
                All Sprints · {tasks.length}
              </option>

              <option value="BACKLOG">
                Backlog / No Sprint · {
                  tasks.filter(
                    (task) => !task.sprintId,
                  ).length
                }
              </option>

              {sprints.map((sprint) => {
                const taskCount =
                  tasks.filter(
                    (task) =>
                      task.sprintId ===
                      sprint.id,
                  ).length;

                return (
                  <option
                    key={sprint.id}
                    value={sprint.id}
                  >
                    {sprint.status ===
                    "ACTIVE"
                      ? "● "
                      : ""}
                    {sprint.name} ·{" "}
                    {taskCount}
                  </option>
                );
              })}
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {selectedSprintId === "ALL" ? (
              <span>
                Showing all project tasks
              </span>
            ) : selectedSprintId ===
              "BACKLOG" ? (
              <span>
                Showing backlog tasks
              </span>
            ) : (
              (() => {
                const selectedSprint =
                  sprints.find(
                    (sprint) =>
                      sprint.id ===
                      selectedSprintId,
                  );

                return selectedSprint ? (
                  <>
                    {selectedSprint.status ===
                      "ACTIVE" && (
                      <Check className="size-3.5 text-primary" />
                    )}
                    <span className="max-w-[180px] truncate">
                      {selectedSprint.name}
                    </span>
                  </>
                ) : null;
              })()
            )}
          </div>
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
            onCreated={
              handleTaskCreated
            }
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={
          closestCorners
        }
        onDragStart={
          handleDragStart
        }
        onDragCancel={
          handleDragCancel
        }
        onDragEnd={
          handleDragEnd
        }
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(
            (column) => (
              <TaskColumn
                key={
                  column.status
                }
                projectId={
                  projectId
                }
                title={
                  column.title
                }
                status={
                  column.status
                }
                tasks={
                  groupedTasks[
                    column.status
                  ]
                }
                onUpdated={
                  handleTaskUpdated
                }
              />
            ),
          )}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-[280px] rotate-2 opacity-95">
              <TaskCard
                projectId={
                  projectId
                }
                task={
                  activeTask
                }
                onUpdated={
                  handleTaskUpdated
                }
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}