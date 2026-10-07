import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { addTeamMemberSchema } from "@/features/team/schemas/team-member.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { teamService } from "@/server/services/team.service";

type Context = {
  params: Promise<{
    teamId: string;
  }>;
};

function statusFor(message: string) {
  if (
    message.includes("not found") ||
    message.includes("not a member")
  ) {
    return 404;
  }

  if (
    message.includes("Only workspace") ||
    message.includes("already a member")
  ) {
    return message.includes("already a member")
      ? 409
      : 403;
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

    const members =
      await teamService.getMembers({
        userId: session.user.id,
        organizationId: workspace.id,
        teamId,
      });

    return NextResponse.json({
      members,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load team members.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}

export async function POST(
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
      addTeamMemberSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid team member.",
        },
        { status: 400 },
      );
    }

    const member =
      await teamService.addMember({
        userId: session.user.id,
        organizationId: workspace.id,
        teamId,
        targetUserId: parsed.data.userId,
      });

    return NextResponse.json(
      { member },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to add team member.";

    return NextResponse.json(
      { message },
      { status: statusFor(message) },
    );
  }
}