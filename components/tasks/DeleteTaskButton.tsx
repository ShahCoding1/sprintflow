"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

type DeleteTaskButtonProps = {
  projectId: string;
  taskId: string;
  taskTitle: string;
};

export default function DeleteTaskButton({
  projectId,
  taskId,
  taskTitle,
}: DeleteTaskButtonProps) {
  const router = useRouter();

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${taskTitle}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        setError(
          result.message ??
            "Unable to delete the task.",
        );
        return;
      }

      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch {
      setError(
        "Unable to delete the task. Please try again.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDeleting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}

        {isDeleting
          ? "Deleting..."
          : "Delete Task"}
      </button>

      {error && (
        <p
          role="alert"
          className="max-w-xs text-right text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}