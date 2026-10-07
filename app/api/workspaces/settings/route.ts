import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updateWorkspaceSchema } from "@/features/workspace/schemas/update-workspace.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { workspaceSettingsService } from "@/server/services/workspace-settings.service";

function getErrorStatus(message: string) {
  if (
    message.includes("not a member") ||
    message.includes("not found")
  ) {
    return 404;
  }

  if (
    message.includes("Only") ||
    message.includes("owner") ||
    message.includes("administrator") ||
    message.includes("cannot")
  ) {
    return 403;
  }

  if (message.includes("already in use")) {
    return 409;
  }

  return 400;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          message: "No active workspace selected.",
        },
        {
          status: 404,
        },
      );
    }

    const result =
      await workspaceSettingsService.getWorkspace(
        session.user.id,
        workspace.id,
      );

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load workspace settings.";

    return NextResponse.json(
      {
        message,
      },
      {
        status: getErrorStatus(message),
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          message: "No active workspace selected.",
        },
        {
          status: 404,
        },
      );
    }

    const body = await request.json();

    const parsed =
      updateWorkspaceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ??
            "Invalid workspace settings.",
        },
        {
          status: 400,
        },
      );
    }

    const updated =
      await workspaceSettingsService.updateWorkspace({
        userId: session.user.id,
        organizationId: workspace.id,
        name: parsed.data.name,
        slug: parsed.data.slug,
        description:
          parsed.data.description ?? null,
      });

    return NextResponse.json({
      workspace: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update workspace settings.";

    return NextResponse.json(
      {
        message,
      },
      {
        status: getErrorStatus(message),
      },
    );
  }
}