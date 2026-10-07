import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createInvitationSchema } from "@/features/invitation/schemas/invitation.schema";
import { invitationService } from "@/server/services/invitation.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 },
      );
    }

    const invitations =
      await invitationService.getInvitations({
        organizationId: workspace.id,
        userId: session.user.id,
      });

    return NextResponse.json({
      invitations,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load invitations.";

    const status =
      message.includes("not authorized")
        ? 403
        : 500;

    return NextResponse.json(
      { error: message },
      { status },
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
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found." },
        { status: 404 },
      );
    }

    const body = await request.json();

    const parsed =
      createInvitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ??
            "Invalid invitation data.",
        },
        { status: 400 },
      );
    }

    const result =
      await invitationService.createInvitation({
        organizationId: workspace.id,
        inviterId: session.user.id,
        email: parsed.data.email,
        role: parsed.data.role,
      });

    const origin =
      new URL(request.url).origin;

    return NextResponse.json(
      {
        invitation: result.invitation,
        inviteUrl:
          `${origin}/invitations/${result.token}`,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create invitation.";

    let status = 500;

    if (
      message.includes("not authorized") ||
      message.includes("cannot invite")
    ) {
      status = 403;
    } else if (
      message.includes("already a workspace member") ||
      message.includes("pending invitation")
    ) {
      status = 409;
    }

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}