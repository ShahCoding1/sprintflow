"use client";

import {
  Loader2,
  MessageSquare,
  Pencil,
  RefreshCw,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

type CommentUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type TaskComment = {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: CommentUser;
};

type TaskCommentsProps = {
  projectId: string;
  taskId: string;
  currentUserId: string;
};

export default function TaskComments({
  projectId,
  taskId,
  currentUserId,
}: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [content, setContent] = useState("");
  const [editingId, setEditingId] =
    useState<string | null>(null);
  const [editingContent, setEditingContent] =
    useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadComments() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to load comments.",
        );
      }

      setComments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load comments.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmed = content.trim();

    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmed,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to create comment.",
        );
      }

      setComments((current) => [
        ...current,
        data,
      ]);
      setContent("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create comment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(comment: TaskComment) {
    setEditingId(comment.id);
    setEditingContent(comment.content);
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingContent("");
  }

  async function handleUpdate(commentId: string) {
    const trimmed = editingContent.trim();

    if (!trimmed || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmed,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to update comment.",
        );
      }

      setComments((current) =>
        current.map((comment) =>
          comment.id === commentId
            ? data
            : comment,
        ),
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update comment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (submitting) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this comment?",
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/projects/${projectId}/comments/${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.error ?? "Failed to delete comment.",
        );
      }

      setComments((current) =>
        current.filter(
          (comment) => comment.id !== commentId,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete comment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function getInitials(user: CommentUser) {
    return (
      user.name ??
      user.email ??
      "U"
    )
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <MessageSquare className="size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-base font-semibold">
              Comments
            </h2>

            <p className="text-xs text-muted-foreground">
              Discuss this task with your team.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadComments}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={[
              "size-4",
              loading ? "animate-spin" : "",
            ].join(" ")}
          />
          <span className="hidden sm:inline">
            Refresh
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-5"
      >
        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="Write a comment..."
          maxLength={5000}
          rows={4}
          disabled={submitting}
          className="w-full resize-y rounded-xl border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {content.length}/5000
          </span>

          <button
            type="submit"
            disabled={
              submitting ||
              !content.trim()
            }
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Comment
          </button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-10 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/50" />

            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No comments yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground/70">
              Start the conversation.
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner =
              comment.userId === currentUserId;

            const isEditing =
              editingId === comment.id;

            return (
              <article
                key={comment.id}
                className="rounded-xl border bg-background p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {getInitials(comment.user)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold">
                        {comment.user.name ??
                          comment.user.email}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {formatDate(
                          comment.createdAt,
                        )}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="mt-3">
                        <textarea
                          value={editingContent}
                          onChange={(event) =>
                            setEditingContent(
                              event.target.value,
                            )
                          }
                          maxLength={5000}
                          rows={4}
                          disabled={submitting}
                          className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        />

                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate(
                                comment.id,
                              )
                            }
                            disabled={
                              submitting ||
                              !editingContent.trim()
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                          >
                            {submitting && (
                              <Loader2 className="size-3.5 animate-spin" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                        {comment.content}
                      </p>
                    )}
                  </div>

                  {isOwner && !isEditing && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          startEditing(comment)
                        }
                        disabled={submitting}
                        aria-label="Edit comment"
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                      >
                        <Pencil className="size-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(comment.id)
                        }
                        disabled={submitting}
                        aria-label="Delete comment"
                        className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}