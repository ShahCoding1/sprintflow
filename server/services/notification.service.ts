import { notificationRepository } from "@/server/repositories/notification.repository";

export const notificationService = {
  async getNotifications(data: {
    userId: string;
    limit: number;
    unreadOnly?: boolean;
  }) {
    const notifications =
      await notificationRepository.findMany(data);

    const unreadCount =
      await notificationRepository.countUnread(
        data.userId,
      );

    return {
      notifications,
      unreadCount,
    };
  },

  async markAsRead(data: {
    notificationId: string;
    userId: string;
  }) {
    const notification =
      await notificationRepository.findById(data);

    if (!notification) {
      throw new Error("Notification not found.");
    }

    await notificationRepository.markAsRead(data);

    return {
      success: true,
    };
  },

  async markAllAsRead(userId: string) {
    await notificationRepository.markAllAsRead(userId);

    return {
      success: true,
    };
  },

  async delete(data: {
    notificationId: string;
    userId: string;
  }) {
    const notification =
      await notificationRepository.findById(data);

    if (!notification) {
      throw new Error("Notification not found.");
    }

    await notificationRepository.delete(data);

    return {
      success: true,
    };
  },
};