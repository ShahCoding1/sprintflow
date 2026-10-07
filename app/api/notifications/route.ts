import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { notificationListSchema } from "@/features/notification/schemas/notification.schema";
import { notificationAuthorizationService } from "@/server/services/notification-authorization.service";
import { notificationService } from "@/server/services/notification.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    const userId =
      notificationAuthorizationService.authorizeUser(
        session?.user?.id,
      );

    const url = new URL(request.url);

    const parsed =
      notificationListSchema.safeParse({
        limit: url.searchParams.get("limit") ?? undefined,
        unreadOnly:
          url.searchParams.get("unreadOnly") ??
          undefined,
      });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid notification query.",
        },
        {
          status: 400,
        },
      );
    }

    const result =
      await notificationService.getNotifications({
        userId,
        limit: parsed.data.limit,
        unreadOnly: parsed.data.unreadOnly,
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

    console.error(
      "GET /api/notifications failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Unable to load notifications.",
      },
      {
        status: 500,
      },
    );
  }
}