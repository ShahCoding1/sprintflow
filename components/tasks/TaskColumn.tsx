"use client";

import { Inbox } from "lucide-react";

import TaskCard, { type BoardTask } from "./TaskCard";

type TaskColumnProps = {
  projectId: string;
  title: string;
  tasks: BoardTask[];
  onUpdated: (task: BoardTask) => void;
};

export default function TaskColumn({
  projectId,
  title,
  tasks,
  onUpdated,
}: TaskColumnProps) {
  return (
    <section className="flex min-h-[420px] min-w-[280px] flex-1 flex-col rounded-2xl border bg-muted/30">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">
            {title}
          </h2>

          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              projectId={projectId}
              task={task}
              onUpdated={onUpdated}
            />
          ))
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed bg-background/50 px-4 py-10 text-center">
            <Inbox className="size-8 text-muted-foreground/50" />

            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No tasks
            </p>

            <p className="mt-1 text-xs text-muted-foreground/70">
              Tasks added to this status will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}