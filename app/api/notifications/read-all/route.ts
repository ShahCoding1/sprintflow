import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { notificationAuthorizationService } from "@/server/services/notification-authorization.service";
import { notificationService } from "@/server/services/notification.service";

export async function PATCH() {
  try {
    const session = await auth();

    const userId =
      notificationAuthorizationService.authorizeUser(
        session?.user?.id,
      );

    const result =
      await notificationService.markAllAsRead(
        userId,
      );

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

    console.error(
      "PATCH /api/notifications/read-all failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to mark notifications as read.",
      },
      {
        status: 500,
      },
    );
  }
}