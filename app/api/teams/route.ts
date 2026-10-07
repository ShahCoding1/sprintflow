import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createTeamSchema } from "@/features/team/schemas/team.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { teamService } from "@/server/services/team.service";

function statusFor(message: string) {
  if (message.includes("not a member")) {
    return 403;
  }

  if (message.includes("already exists")) {
    return 409;
  }

  return 400;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

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

    const teams = await teamService.getTeams(
      session.user.id,
      workspace.id,
    );

    return NextResponse.json({
      teams,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load teams.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized." },
        { status: 401 },
      );
    }

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
      createTeamSchema.safeParse(body);

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

    const team = await teamService.createTeam({
      userId: session.user.id,
      organizationId: workspace.id,
      name: parsed.data.name,
      description:
        parsed.data.description ?? null,
    });

    return NextResponse.json(
      { team },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create team.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}