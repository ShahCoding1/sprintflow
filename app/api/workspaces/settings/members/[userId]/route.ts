import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updateWorkspaceMemberSchema } from "@/features/workspace/schemas/workspace-member.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { workspaceSettingsService } from "@/server/services/workspace-settings.service";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

function getErrorStatus(message: string) {
  if (
    message.includes("not found") ||
    message.includes("not a member")
  ) {
    return 404;
  }

  if (
    message.includes("Only") ||
    message.includes("cannot") ||
    message.includes("owner") ||
    message.includes("administrator")
  ) {
    return 403;
  }

  return 400;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
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

    const { userId } = await context.params;

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
      updateWorkspaceMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid member role.",
        },
        {
          status: 400,
        },
      );
    }

    const member =
      await workspaceSettingsService.updateMemberRole({
        actorId: session.user.id,
        organizationId: workspace.id,
        targetUserId: userId,
        role: parsed.data.role,
      });

    return NextResponse.json({
      member,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update workspace member.";

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

export async function DELETE(
  request: Request,
  context: RouteContext,
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

    const { userId } = await context.params;

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

    await workspaceSettingsService.removeMember({
      actorId: session.user.id,
      organizationId: workspace.id,
      targetUserId: userId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to remove workspace member.";

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