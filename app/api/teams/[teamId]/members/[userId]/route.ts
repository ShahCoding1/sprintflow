import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { teamService } from "@/server/services/team.service";

type Context = {
  params: Promise<{
    teamId: string;
    userId: string;
  }>;
};

function statusFor(message: string) {
  if (
    message.includes("not found") ||
    message.includes("not a member")
  ) {
    return 404;
  }

  if (message.includes("Only workspace")) {
    return 403;
  }

  return 400;
}

export async function DELETE(
  _request: Request,
  context: Context,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

    const {
      teamId,
      userId: targetUserId,
    } = await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          message:
            "No active workspace selected.",
        },
        { status: 404 },
      );
    }

    await teamService.removeMember({
      userId: session.user.id,
      organizationId: workspace.id,
      teamId,
      targetUserId,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to remove team member.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}