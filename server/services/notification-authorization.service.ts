import { notificationRepository } from "@/server/repositories/notification.repository";

export const notificationAuthorizationService = {
  async authorizeNotificationAccess(data: {
    notificationId: string;
    userId: string;
  }) {
    const notification =
      await notificationRepository.findById({
        notificationId: data.notificationId,
        userId: data.userId,
      });

    if (!notification) {
      throw new Error("Notification not found.");
    }

    return notification;
  },

  authorizeUser(userId: string | null | undefined) {
    if (!userId) {
      throw new Error("Authentication required.");
    }

    return userId;
  },
};