import { prisma } from "@/lib/db";

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

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
};

export const notificationEventService = {
  async create(
    data: CreateNotificationInput,
  ) {
    if (!data.userId) {
      return null;
    }

    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title.trim(),
        message: data.message.trim(),
      },
    });
  },

  async createMany(
    notifications: CreateNotificationInput[],
  ) {
    const validNotifications =
      notifications.filter(
        (notification) =>
          Boolean(notification.userId) &&
          Boolean(notification.title.trim()) &&
          Boolean(notification.message.trim()),
      );

    if (validNotifications.length === 0) {
      return {
        count: 0,
      };
    }

    const result =
      await prisma.notification.createMany({
        data: validNotifications.map(
          (notification) => ({
            userId: notification.userId,
            type: notification.type,
            title: notification.title.trim(),
            message:
              notification.message.trim(),
          }),
        ),
      });

    return result;
  },

  async notifyTaskAssignee(data: {
    assigneeId: string | null;
    taskTitle: string;
    actorId?: string;
  }) {
    if (
      !data.assigneeId ||
      data.assigneeId === data.actorId
    ) {
      return null;
    }

    return this.create({
      userId: data.assigneeId,
      type: "TASK_ASSIGNED",
      title: "Task assigned to you",
      message: `You were assigned the task "${data.taskTitle}".`,
    });
  },

  async notifyTaskStatusChanged(data: {
    userId: string | null;
    taskTitle: string;
    status: string;
    actorId?: string;
  }) {
    if (
      !data.userId ||
      data.userId === data.actorId
    ) {
      return null;
    }

    return this.create({
      userId: data.userId,
      type: "TASK_STATUS_CHANGED",
      title: "Task status changed",
      message: `"${data.taskTitle}" is now ${data.status}.`,
    });
  },

  async notifyTaskCommented(data: {
    userIds: string[];
    taskTitle: string;
    actorId: string;
  }) {
    const recipientIds = [
      ...new Set(
        data.userIds.filter(
          (userId) =>
            userId !== data.actorId,
        ),
      ),
    ];

    return this.createMany(
      recipientIds.map((userId) => ({
        userId,
        type: "TASK_COMMENTED" as const,
        title: "New task comment",
        message: `A new comment was added to "${data.taskTitle}".`,
      })),
    );
  },

  async notifySprintStarted(data: {
    userIds: string[];
    sprintName: string;
    actorId: string;
  }) {
    const recipientIds = [
      ...new Set(
        data.userIds.filter(
          (userId) =>
            userId !== data.actorId,
        ),
      ),
    ];

    return this.createMany(
      recipientIds.map((userId) => ({
        userId,
        type: "SPRINT_STARTED" as const,
        title: "Sprint started",
        message: `Sprint "${data.sprintName}" has started.`,
      })),
    );
  },

  async notifySprintCompleted(data: {
    userIds: string[];
    sprintName: string;
    actorId: string;
  }) {
    const recipientIds = [
      ...new Set(
        data.userIds.filter(
          (userId) =>
            userId !== data.actorId,
        ),
      ),
    ];

    return this.createMany(
      recipientIds.map((userId) => ({
        userId,
        type: "SPRINT_COMPLETED" as const,
        title: "Sprint completed",
        message: `Sprint "${data.sprintName}" has been completed.`,
      })),
    );
  },
};