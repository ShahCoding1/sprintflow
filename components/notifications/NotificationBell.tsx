"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ExternalLink,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_MENTIONED"
  | "TASK_COMMENTED"
  | "TASK_STATUS_CHANGED"
  | "SPRINT_STARTED"
  | "SPRINT_COMPLETED"
  | "PROJECT_INVITATION"
  | "ORGANIZATION_INVITATION"
  | "SYSTEM";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
};

function formatNotificationTime(
  createdAt: string,
) {
  const date = new Date(createdAt);
  const now = new Date();

  const diffMs =
    now.getTime() - date.getTime();

  const diffMinutes = Math.floor(
    diffMs / 60000,
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(
    diffMinutes / 60,
  );

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(
    diffHours / 24,
  );

  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}

function getNotificationHref(
  notification: Notification,
) {
  const metadata =
    notification as Notification & {
      taskId?: string;
      projectId?: string;
      sprintId?: string;
      entityId?: string;
    };

  if (
    metadata.projectId &&
    metadata.taskId
  ) {
    return `/projects/${metadata.projectId}/tasks/${metadata.taskId}`;
  }

  if (
    metadata.projectId &&
    metadata.sprintId
  ) {
    return `/projects/${metadata.projectId}/sprints/${metadata.sprintId}`;
  }

  if (metadata.projectId) {
    return `/projects/${metadata.projectId}`;
  }

  return null;
}

export default function NotificationBell() {
  const router = useRouter();

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] =
    useState(false);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isUpdating, setIsUpdating] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function loadNotifications() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/notifications?limit=50",
        {
          cache: "no-store",
        },
      );

      const result =
        (await response.json()) as
          | NotificationsResponse
          | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Unable to load notifications.",
        );
      }

      if (
        "notifications" in result &&
        Array.isArray(result.notifications)
      ) {
        setNotifications(
          result.notifications,
        );

        setUnreadCount(
          result.unreadCount ?? 0,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load notifications.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initializeNotifications() {
      if (cancelled) {
        return;
      }

      await loadNotifications();
    }

    void initializeNotifications();

    const interval = window.setInterval(
      () => {
        if (!cancelled) {
          void loadNotifications();
        }
      },
      30000,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  async function handleMarkRead(
    notificationId: string,
  ) {
    setIsUpdating(notificationId);
    setError(null);

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: "PATCH",
        },
      );

      const result =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to mark notification as read.",
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                readAt:
                  new Date().toISOString(),
              }
            : notification,
        ),
      );

      setUnreadCount((current) =>
        Math.max(current - 1, 0),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update notification.",
      );
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0) {
      return;
    }

    setIsUpdating("all");
    setError(null);

    try {
      const response = await fetch(
        "/api/notifications/read-all",
        {
          method: "PATCH",
        },
      );

      const result =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to mark notifications as read.",
        );
      }

      const now =
        new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt:
            notification.readAt ?? now,
        })),
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to mark notifications as read.",
      );
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleDelete(
    notificationId: string,
  ) {
    setIsUpdating(notificationId);
    setError(null);

    try {
      const response = await fetch(
        `/api/notifications/${notificationId}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          result.error ??
            "Unable to delete notification.",
        );
      }

      const deleted =
        notifications.find(
          (notification) =>
            notification.id ===
            notificationId,
        );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification.id !==
            notificationId,
        ),
      );

      if (
        deleted &&
        !deleted.readAt
      ) {
        setUnreadCount((current) =>
          Math.max(current - 1, 0),
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete notification.",
      );
    } finally {
      setIsUpdating(null);
    }
  }

  async function handleNotificationClick(
    notification: Notification,
  ) {
    if (!notification.readAt) {
      await handleMarkRead(
        notification.id,
      );
    }

    const href =
      getNotificationHref(notification);

    if (href) {
      setIsOpen(false);
      router.push(href);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setIsOpen((current) => !current)
        }
        aria-label={`Notifications${
          unreadCount > 0
            ? `, ${unreadCount} unread`
            : ""
        }`}
        aria-expanded={isOpen}
        className="relative inline-flex size-10 items-center justify-center rounded-lg transition hover:bg-muted"
      >
        <Bell className="size-5" />

        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-[calc(100vw-2rem)] max-w-md overflow-hidden rounded-xl border bg-popover shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">
                Notifications
              </h2>

              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "All caught up"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    void handleMarkAllRead()
                  }
                  disabled={
                    isUpdating === "all"
                  }
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition hover:bg-muted disabled:opacity-50"
                >
                  {isUpdating ===
                  "all" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}

                  Mark all read
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setIsOpen(false)
                }
                aria-label="Close notifications"
                className="rounded-md p-1.5 transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive"
            >
              {error}
            </div>
          )}

          <div className="max-h-[min(32rem,70vh)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading notifications...
              </div>
            ) : notifications.length ===
              0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto size-8 text-muted-foreground/50" />

                <p className="mt-3 text-sm font-medium">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(
                  (notification) => {
                    const href =
                      getNotificationHref(
                        notification,
                      );

                    return (
                      <div
                        key={notification.id}
                        className={`group relative px-4 py-3 transition hover:bg-muted/50 ${
                          notification.readAt
                            ? ""
                            : "bg-muted/30"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void handleNotificationClick(
                              notification,
                            )
                          }
                          className="w-full pr-12 text-left"
                        >
                          <div className="flex gap-3">
                            <span
                              className={`mt-1.5 size-2.5 shrink-0 rounded-full ${
                                notification.readAt
                                  ? "bg-muted-foreground/30"
                                  : "bg-primary"
                              }`}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">
                                  {
                                    notification.title
                                  }
                                </p>

                                {href && (
                                  <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                )}
                              </div>

                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                {
                                  notification.message
                                }
                              </p>

                              <p className="mt-2 text-[11px] text-muted-foreground">
                                {formatNotificationTime(
                                  notification.createdAt,
                                )}
                              </p>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              notification.id,
                            )
                          }
                          disabled={
                            isUpdating ===
                            notification.id
                          }
                          aria-label={`Delete ${notification.title}`}
                          className="absolute right-3 top-3 rounded-md p-1.5 opacity-0 transition hover:bg-muted group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                        >
                          {isUpdating ===
                          notification.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}