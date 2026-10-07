import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { notificationIdSchema } from "@/features/notification/schemas/notification.schema";
import { notificationAuthorizationService } from "@/server/services/notification-authorization.service";
import { notificationService } from "@/server/services/notification.service";

type NotificationRouteContext = {
  params: Promise<{
    notificationId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: NotificationRouteContext,
) {
  try {
    const session = await auth();

    const userId =
      notificationAuthorizationService.authorizeUser(
        session?.user?.id,
      );

    const { notificationId } = await context.params;

    const parsed =
      notificationIdSchema.safeParse({
        notificationId,
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid notification ID.",
        },
        {
          status: 400,
        },
      );
    }

    await notificationAuthorizationService.authorizeNotificationAccess(
      {
        notificationId,
        userId,
      },
    );

    const result =
      await notificationService.markAsRead({
        notificationId,
        userId,
      });

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Notification not found."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "PATCH /api/notifications/[notificationId] failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to update notification.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
  context: NotificationRouteContext,
) {
  try {
    const session = await auth();

    const userId =
      notificationAuthorizationService.authorizeUser(
        session?.user?.id,
      );

    const { notificationId } = await context.params;

    const parsed =
      notificationIdSchema.safeParse({
        notificationId,
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid notification ID.",
        },
        {
          status: 400,
        },
      );
    }

    await notificationAuthorizationService.authorizeNotificationAccess(
      {
        notificationId,
        userId,
      },
    );

    const result =
      await notificationService.delete({
        notificationId,
        userId,
      });

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication required."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message === "Notification not found."
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "DELETE /api/notifications/[notificationId] failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to delete notification.",
      },
      {
        status: 500,
      },
    );
  }
}