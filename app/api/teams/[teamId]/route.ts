import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { updateTeamSchema } from "@/features/team/schemas/team.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { teamService } from "@/server/services/team.service";

type Context = {
  params: Promise<{
    teamId: string;
  }>;
};

function statusFor(message: string) {
  if (message.includes("not found")) {
    return 404;
  }

  if (
    message.includes("Only workspace") ||
    message.includes("not a member")
  ) {
    return 403;
  }

  if (message.includes("already exists")) {
    return 409;
  }

  return 400;
}

export async function GET(
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

    const { teamId } = await context.params;

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

    const team = await teamService.getTeam(
      session.user.id,
      workspace.id,
      teamId,
    );

    return NextResponse.json({
      team,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load team.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}

export async function PATCH(
  request: Request,
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

    const { teamId } = await context.params;

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

    const body = await request.json();

    const parsed =
      updateTeamSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid team data.",
        },
        { status: 400 },
      );
    }

    const team = await teamService.updateTeam({
      userId: session.user.id,
      organizationId: workspace.id,
      teamId,
      name: parsed.data.name,
      description:
        parsed.data.description ?? null,
    });

    return NextResponse.json({
      team,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update team.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
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

    const { teamId } = await context.params;

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

    const team = await teamService.deleteTeam({
      userId: session.user.id,
      organizationId: workspace.id,
      teamId,
    });

    return NextResponse.json({
      success: true,
      team,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete team.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}