import { prisma } from "@/lib/db";

export const notificationRepository = {
  async findById(data: {
    notificationId: string;
    userId: string;
  }) {
    return prisma.notification.findFirst({
      where: {
        id: data.notificationId,
        userId: data.userId,
      },
    });
  },

  async findMany(data: {
    userId: string;
    limit: number;
    unreadOnly?: boolean;
  }) {
    return prisma.notification.findMany({
      where: {
        userId: data.userId,
        ...(data.unreadOnly
          ? {
              readAt: null,
            }
          : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: data.limit,
    });
  },

  async countUnread(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  },

  async markAsRead(data: {
    notificationId: string;
    userId: string;
  }) {
    return prisma.notification.updateMany({
      where: {
        id: data.notificationId,
        userId: data.userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  async delete(data: {
    notificationId: string;
    userId: string;
  }) {
    return prisma.notification.deleteMany({
      where: {
        id: data.notificationId,
        userId: data.userId,
      },
    });
  },
};